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

// Sync local storage to Supabase (for migration)
export const syncLocalToSupabase = async () => {
  try {
    const localData = localStorage.getItem('offline-lotto-combinations');
    if (!localData) return;
    
    const combinations: number[][] = JSON.parse(localData);
    
    for (const numbers of combinations) {
      await saveCombination(numbers);
    }
    
    // Clear local storage after successful sync
    localStorage.removeItem('offline-lotto-combinations');
  } catch (error) {
    console.error('Error syncing local data:', error);
  }
}; 