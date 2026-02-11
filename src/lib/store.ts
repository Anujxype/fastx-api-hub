import { supabase } from './supabase';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  uses: number;
  enabled: boolean;
}

export interface SearchLog {
  id: string;
  key_name: string;
  endpoint: string;
  query: string;
  created_at: string;
  status: 'success' | 'error';
}

const ADMIN_PASSWORD = 'stk7890';

export async function getKeys(): Promise<ApiKey[]> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching keys:', error);
    return [];
  }
  return data || [];
}

export async function addKey(name: string, key?: string): Promise<ApiKey | null> {
  const keyValue = key || generateKey();
  const { data, error } = await supabase
    .from('api_keys')
    .insert({ name, key: keyValue })
    .select()
    .single();
  if (error) {
    console.error('Error adding key:', error);
    return null;
  }
  return data;
}

export async function deleteKey(id: string) {
  const { error } = await supabase.from('api_keys').delete().eq('id', id);
  if (error) console.error('Error deleting key:', error);
}

export async function toggleKey(id: string, currentEnabled: boolean) {
  const { error } = await supabase
    .from('api_keys')
    .update({ enabled: !currentEnabled })
    .eq('id', id);
  if (error) console.error('Error toggling key:', error);
}

export async function validateAccessKey(key: string): Promise<ApiKey | null> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key', key)
    .eq('enabled', true)
    .single();
  if (error || !data) return null;
  // Increment uses
  await supabase
    .from('api_keys')
    .update({ uses: (data.uses || 0) + 1 })
    .eq('id', data.id);
  return data;
}

export function validateAdmin(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

function generateKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'ak_';
  for (let i = 0; i < 24; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

// Logs
export async function getLogs(): Promise<SearchLog[]> {
  const { data, error } = await supabase
    .from('search_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
  return data || [];
}

export async function addLog(log: { keyName: string; endpoint: string; query: string; status: 'success' | 'error' }) {
  const { error } = await supabase
    .from('search_logs')
    .insert({
      key_name: log.keyName,
      endpoint: log.endpoint,
      query: log.query,
      status: log.status,
    });
  if (error) console.error('Error adding log:', error);
}

export const API_BASE = 'https://anuapi.netlify.app/.netlify/functions/api';

export const ENDPOINTS = [
  { name: 'Mobile Lookup', endpoint: '/mobile', param: 'number', icon: '📱' },
  { name: 'Aadhaar Lookup', endpoint: '/aadhaar', param: 'id', icon: '🆔' },
  { name: 'Email Lookup', endpoint: '/email', param: 'address', icon: '📧' },
  { name: 'GST Lookup', endpoint: '/gst', param: 'number', icon: '🏢' },
  { name: 'Telegram Lookup', endpoint: '/telegram', param: 'user', icon: '✈️' },
  { name: 'IFSC Lookup', endpoint: '/ifsc', param: 'code', icon: '🏦' },
  { name: 'Ration Card Lookup', endpoint: '/rashan', param: 'aadhaar', icon: '🪪' },
  { name: 'UPI Lookup', endpoint: '/upi', param: 'id', icon: '💳' },
  { name: 'UPI Lookup v2', endpoint: '/upi2', param: 'id', icon: '💰' },
  { name: 'Vehicle Lookup', endpoint: '/vehicle', param: 'registration', icon: '🚗' },
  { name: 'General Query', endpoint: '/v2', param: 'query', icon: '🔍' },
  { name: 'PAN Lookup', endpoint: '/pan', param: 'pan', icon: '📋' },
];
