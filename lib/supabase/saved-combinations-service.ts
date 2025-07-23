import { createClient } from './client';

const supabase = createClient();

export interface SavedCombination {
  id: string;
  user_id: string;
  numbers: number[];
  created_at: string;
  name?: string;
}

export interface NumberAnalytics {
  number: number;
  frequency: number;
  percentage: number;
}

// Initialize anonymous user
export const initializeUser = async () => {
  try {
    // Check if already authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Sign in anonymously
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      return data.user;
    }
    
    return user;
  } catch (error) {
    console.error('Error initializing user:', error);
    throw error;
  }
};

// Save a combination
export const saveCombination = async (numbers: number[], name?: string) => {
  try {
    await initializeUser();
    
    const { data, error } = await supabase
      .from('saved_combinations')
      .insert([{ numbers, name }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving combination:', error);
    throw error;
  }
};

// Get user's combinations
export const getUserCombinations = async (): Promise<SavedCombination[]> => {
  try {
    await initializeUser();
    
    const { data, error } = await supabase
      .from('saved_combinations')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching combinations:', error);
    return [];
  }
};

// Delete a combination
export const deleteCombination = async (id: string) => {
  try {
    const { error } = await supabase
      .from('saved_combinations')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting combination:', error);
    throw error;
  }
};

// Get number analytics
export const getNumberAnalytics = async (): Promise<NumberAnalytics[]> => {
  try {
    const { data, error } = await supabase
      .from('number_analytics')
      .select('*')
      .order('frequency', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return [];
  }
};

// Get total count of saved combination rows
export const getTotalSavedCombinations = async (): Promise<{total: number, complete: number, incomplete: number}> => {
  try {
    const { data, error } = await supabase
      .from('saved_combinations')
      .select('numbers');
      
    if (error) throw error;
    
    const combinations = data || [];
    const total = combinations.length;
    
    // Count complete (7 numbers) vs incomplete (less than 7 numbers) rows
    const complete = combinations.filter(combo => combo.numbers.length === 7).length;
    const incomplete = combinations.filter(combo => combo.numbers.length < 7).length;
    
    // Debug logging to see what's in the database
    console.log('🔍 Combination lengths breakdown:');
    const lengthCounts: {[key: number]: number} = {};
    combinations.forEach(combo => {
      const len = combo.numbers.length;
      lengthCounts[len] = (lengthCounts[len] || 0) + 1;
    });
    console.log(lengthCounts);
    console.log(`📊 Total: ${total}, Complete (7): ${complete}, Incomplete (<7): ${incomplete}`);
    
    return { total, complete, incomplete };
  } catch (error) {
    console.error('Error fetching combination counts:', error);
    return { total: 0, complete: 0, incomplete: 0 };
  }
};

// Get total count of unique users who have saved combinations
export const getTotalUsers = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('saved_combinations')
      .select('user_id, created_at');
      
    if (error) throw error;
    
    console.log('🔍 Raw user data from database:', data?.slice(0, 10)); // Show first 10 rows
    
    // Create user tracking strategy:
    // 1. Count all unique non-null user_ids as separate users
    // 2. Count all null user_ids as representing "guest users"
    // 3. Estimate guest users by grouping null entries by day (assumes 1 guest per day max)
    
    const authenticatedUsers = new Set();
    const nullUserEntries: string[] = [];
    
    data?.forEach(row => {
      if (row.user_id && row.user_id.trim() !== '') {
        authenticatedUsers.add(row.user_id);
      } else {
        // For null users, group by date to estimate unique guests
        const date = new Date(row.created_at).toISOString().split('T')[0];
        nullUserEntries.push(date);
      }
    });
    
    // Estimate unique guest users by unique dates (conservative estimate)
    const uniqueGuestDays = new Set(nullUserEntries);
    const estimatedGuestUsers = Math.max(uniqueGuestDays.size, nullUserEntries.length > 0 ? 1 : 0);
    
    const totalUsers = authenticatedUsers.size + estimatedGuestUsers;
    
    console.log('👥 Authenticated users:', authenticatedUsers.size);
    console.log('👥 Estimated guest users:', estimatedGuestUsers);
    console.log('👥 Total estimated users:', totalUsers);
    console.log('📊 Total rows in database:', data?.length || 0);
    console.log('🔍 Sample authenticated user IDs:', Array.from(authenticatedUsers).slice(0, 3));
    console.log('🔍 Null user entry dates:', Array.from(uniqueGuestDays).slice(0, 5));
    
    return totalUsers;
  } catch (error) {
    console.error('Error fetching user count:', error);
    return 0;
  }
};

// Sync local storage to Supabase (for migration) - ONLY real numberSequences
export const syncLocalToSupabase = async () => {
  try {
    console.log('🔄 Checking for real numberSequences to sync...');
    
    // Check for real numberSequences (this is the actual saved data)
    const numberSequences = localStorage.getItem('numberSequences');
    if (!numberSequences) {
      console.log('ℹ️ No numberSequences found in localStorage');
      return;
    }
    
    let realCombinations: number[][];
    try {
      realCombinations = JSON.parse(numberSequences);
      console.log('📊 Found real numberSequences:', realCombinations);
    } catch (parseError) {
      console.error('❌ Error parsing numberSequences:', parseError);
      return;
    }
    
    // Validate the data format
    if (!Array.isArray(realCombinations) || realCombinations.length === 0) {
      console.log('ℹ️ No valid numberSequences to sync');
      return;
    }
    
    // Get existing combinations to avoid duplicates
    const existingCombinations = await getUserCombinations();
    const existingNumbers = existingCombinations.map(item => 
      JSON.stringify(item.numbers.sort((a, b) => a - b))
    );
    
    // Sync only new combinations
    for (let i = 0; i < realCombinations.length; i++) {
      const numbers = realCombinations[i];
      
      // Validate that this is a proper array of 7 numbers
      if (!Array.isArray(numbers) || numbers.length !== 7) {
        console.log(`⏭️ Skipping invalid combination ${i + 1}:`, numbers);
        continue;
      }
      
      const sortedNumbers = numbers.sort((a, b) => a - b);
      const numberKey = JSON.stringify(sortedNumbers);
      
      if (!existingNumbers.includes(numberKey)) {
        console.log(`💾 Syncing real combination ${i + 1}:`, numbers);
        await saveCombination(numbers);
      } else {
        console.log(`⏭️ Combination ${i + 1} already exists:`, numbers);
      }
    }
    
    console.log('✅ Real numberSequences sync complete');
  } catch (error) {
    console.error('❌ Error syncing real numberSequences:', error);
  }
}; 