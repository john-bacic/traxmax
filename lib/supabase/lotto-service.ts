import { createClient } from '@/lib/supabase/client';

export interface LottoDrawing {
  id: number;
  draw_date: string;
  numbers: number[];
  bonus_number: number;
  jackpot_amount: number;
  created_at: string;
  updated_at: string;
}

export interface FrequencyData {
  [key: number]: number;
}

export interface PairFrequencyData {
  [key: string]: number;
}

class LottoService {
  private supabase = createClient();

  // Get all lotto drawings, ordered by date (newest first)
  async getAllDrawings(): Promise<LottoDrawing[]> {
    const { data, error } = await this.supabase
      .from('lotto_drawings')
      .select('*')
      .order('draw_date', { ascending: false });

    if (error) {
      console.error('Error fetching lotto drawings:', error);
      throw error;
    }

    return data || [];
  }

  // Get limited number of recent drawings
  async getRecentDrawings(limit: number): Promise<LottoDrawing[]> {
    const { data, error } = await this.supabase
      .from('lotto_drawings')
      .select('*')
      .order('draw_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent lotto drawings:', error);
      throw error;
    }

    return data || [];
  }

  // Get drawings within a date range
  async getDrawingsInRange(startDate: string, endDate: string): Promise<LottoDrawing[]> {
    const { data, error } = await this.supabase
      .from('lotto_drawings')
      .select('*')
      .gte('draw_date', startDate)
      .lte('draw_date', endDate)
      .order('draw_date', { ascending: false });

    if (error) {
      console.error('Error fetching lotto drawings in range:', error);
      throw error;
    }

    return data || [];
  }

  // Calculate frequency of each number across given drawings
  calculateNumberFrequencies(drawings: LottoDrawing[]): FrequencyData {
    const frequencies: FrequencyData = {};
    
    // Initialize all numbers 1-50
    for (let i = 1; i <= 50; i++) {
      frequencies[i] = 0;
    }

    // Count frequencies
    drawings.forEach(drawing => {
      drawing.numbers.forEach(number => {
        frequencies[number]++;
      });
      // Don't include bonus number in main frequency calculation
    });

    return frequencies;
  }

  // Calculate pair frequencies
  calculatePairFrequencies(drawings: LottoDrawing[]): PairFrequencyData {
    const pairFreqs: PairFrequencyData = {};

    drawings.forEach(drawing => {
      // Generate all possible pairs from the 7 main numbers
      for (let i = 0; i < drawing.numbers.length; i++) {
        for (let j = i + 1; j < drawing.numbers.length; j++) {
          const pair = [drawing.numbers[i], drawing.numbers[j]].sort().join('-');
          pairFreqs[pair] = (pairFreqs[pair] || 0) + 1;
        }
      }
    });

    return pairFreqs;
  }

  // Get most frequent numbers
  getMostFrequentNumbers(frequencies: FrequencyData, limit: number = 20): Array<{number: number, frequency: number}> {
    return Object.entries(frequencies)
      .map(([number, frequency]) => ({ number: parseInt(number), frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  // Get most frequent pairs
  getMostFrequentPairs(pairFreqs: PairFrequencyData, limit: number = 20): Array<{pair: string, frequency: number}> {
    return Object.entries(pairFreqs)
      .map(([pair, frequency]) => ({ pair, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  // Get last N days of drawings
  async getLastNDaysDrawings(days: number): Promise<LottoDrawing[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await this.supabase
      .from('lotto_drawings')
      .select('*')
      .gte('draw_date', startDate.toISOString().split('T')[0])
      .order('draw_date', { ascending: false });

    if (error) {
      console.error('Error fetching last N days drawings:', error);
      throw error;
    }

    return data || [];
  }

  // Insert a new drawing (for admin use)
  async insertDrawing(drawing: Omit<LottoDrawing, 'id' | 'created_at' | 'updated_at'>): Promise<LottoDrawing> {
    const { data, error } = await this.supabase
      .from('lotto_drawings')
      .insert(drawing)
      .select()
      .single();

    if (error) {
      console.error('Error inserting lotto drawing:', error);
      throw error;
    }

    return data;
  }

  // Update a drawing (for admin use)
  async updateDrawing(id: number, updates: Partial<Omit<LottoDrawing, 'id' | 'created_at' | 'updated_at'>>): Promise<LottoDrawing> {
    const { data, error } = await this.supabase
      .from('lotto_drawings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lotto drawing:', error);
      throw error;
    }

    return data;
  }

  // Delete a drawing (for admin use)
  async deleteDrawing(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('lotto_drawings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lotto drawing:', error);
      throw error;
    }
  }
}

export const lottoService = new LottoService();