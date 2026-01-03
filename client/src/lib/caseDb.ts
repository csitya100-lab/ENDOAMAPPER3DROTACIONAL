import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Lesion } from './lesionStore';

let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabase) return supabase;
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
  
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  return supabase;
}

export interface CaseData {
  id: string;
  patient_name: string;
  exam_date: string;
  lesions: Lesion[];
  created_at?: string;
}

export async function saveCaseToDb(caseData: Omit<CaseData, 'id' | 'created_at'>): Promise<string> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('cases')
    .insert({
      patient_name: caseData.patient_name,
      exam_date: caseData.exam_date,
      lesions: caseData.lesions,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao salvar caso:', error);
    throw new Error(`Erro ao salvar caso: ${error.message}`);
  }
  
  return data.id;
}

export async function loadCaseFromDb(caseId: string): Promise<CaseData | null> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Erro ao carregar caso:', error);
    throw new Error(`Erro ao carregar caso: ${error.message}`);
  }
  
  return {
    id: data.id,
    patient_name: data.patient_name,
    exam_date: data.exam_date,
    lesions: data.lesions,
    created_at: data.created_at,
  };
}

export function isSupabaseConfigured(): boolean {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}
