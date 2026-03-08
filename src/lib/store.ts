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
  device: string | null;
  browser: string | null;
  os: string | null;
  ip: string | null;
  location: string | null;
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

// Device detection helpers
function getBrowserName(ua: string): string {
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung Browser';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Unknown';
}

function getOSName(ua: string): string {
  if (ua.includes('Windows NT 10')) return 'Windows 10';
  if (ua.includes('Windows NT 11') || (ua.includes('Windows NT 10') && ua.includes('Win64'))) return 'Windows 10+';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('Android')) {
    const match = ua.match(/Android\s([\d.]+)/);
    return match ? `Android ${match[1]}` : 'Android';
  }
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown';
}

function getDeviceType(ua: string): string {
  if (ua.includes('Mobile') || ua.includes('Android')) return 'Mobile';
  if (ua.includes('Tablet') || ua.includes('iPad')) return 'Tablet';
  return 'Desktop';
}

async function getLocationInfo(): Promise<{ ip: string; location: string }> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { ip: 'Unknown', location: 'Unknown' };
    const data = await res.json();
    return {
      ip: data.ip || 'Unknown',
      location: [data.city, data.region, data.country_name].filter(Boolean).join(', ') || 'Unknown',
    };
  } catch {
    return { ip: 'Unknown', location: 'Unknown' };
  }
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
  const ua = navigator.userAgent;
  const locationInfo = await getLocationInfo();

  const { error } = await supabase
    .from('search_logs')
    .insert({
      key_name: log.keyName,
      endpoint: log.endpoint,
      query: log.query,
      status: log.status,
      device: getDeviceType(ua),
      browser: getBrowserName(ua),
      os: getOSName(ua),
      ip: locationInfo.ip,
      location: locationInfo.location,
    });
  if (error) console.error('Error adding log:', error);
}

export const API_BASE = 'https://anuapi.netlify.app/.netlify/functions/api';

export const ENDPOINTS = [
  { name: 'Mobile Lookup', endpoint: '/mobile', param: 'number', icon: 'Smartphone' },
  { name: 'Aadhaar Lookup', endpoint: '/aadhaar', param: 'id', icon: 'Fingerprint' },
  { name: 'Email Lookup', endpoint: '/email', param: 'address', icon: 'Mail' },
  { name: 'GST Lookup', endpoint: '/gst', param: 'number', icon: 'Building2' },
  { name: 'Telegram Lookup', endpoint: '/telegram', param: 'user', icon: 'Send' },
  { name: 'IFSC Lookup', endpoint: '/ifsc', param: 'code', icon: 'Landmark' },
  { name: 'Ration Card Lookup', endpoint: '/rashan', param: 'aadhaar', icon: 'CreditCard' },
  { name: 'UPI Lookup', endpoint: '/upi', param: 'id', icon: 'Wallet' },
  { name: 'UPI Lookup v2', endpoint: '/upi2', param: 'id', icon: 'BadgeIndianRupee' },
  { name: 'Vehicle Lookup', endpoint: '/vehicle', param: 'registration', icon: 'Car' },
  { name: 'General Query', endpoint: '/v2', param: 'query', icon: 'SearchCode' },
  { name: 'PAN Lookup', endpoint: '/pan', param: 'pan', icon: 'ClipboardList' },
];
