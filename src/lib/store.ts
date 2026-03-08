import { supabase } from './supabase';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  uses: number;
  enabled: boolean;
  expires_at: string | null;
  allowed_ips: string[] | null;
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

export interface AuditLog {
  id: string;
  action: string;
  target: string;
  details: string | null;
  created_at: string;
}

const ADMIN_PASSWORD = 'stk7890';

// Audit logging
export async function addAuditLog(action: string, target: string, details?: string) {
  const { error } = await supabase.from('audit_logs').insert({
    action, target, details: details || null,
  });
  if (error) console.error('Audit log error:', error);
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
  return data || [];
}

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

export async function addKey(name: string, key?: string, expiresAt?: string | null, allowedIps?: string[]): Promise<ApiKey | null> {
  const keyValue = key || generateKey();
  const payload: Record<string, unknown> = { name, key: keyValue };
  if (expiresAt) payload.expires_at = expiresAt;
  if (allowedIps && allowedIps.length > 0) payload.allowed_ips = allowedIps;
  const { data, error } = await supabase
    .from('api_keys')
    .insert(payload)
    .select()
    .single();
  if (error) {
    console.error('Error adding key:', error);
    return null;
  }
  await addAuditLog('KEY_CREATED', name, `Key: ${keyValue.slice(0, 10)}...${allowedIps?.length ? `, IPs: ${allowedIps.join(', ')}` : ''}`);
  return data;
}

export async function deleteKey(id: string) {
  // Get key name for audit
  const { data: key } = await supabase.from('api_keys').select('name').eq('id', id).single();
  const { error } = await supabase.from('api_keys').delete().eq('id', id);
  if (error) console.error('Error deleting key:', error);
  else await addAuditLog('KEY_DELETED', key?.name || id);
}

export async function toggleKey(id: string, currentEnabled: boolean) {
  const { data: key } = await supabase.from('api_keys').select('name').eq('id', id).single();
  const { error } = await supabase
    .from('api_keys')
    .update({ enabled: !currentEnabled })
    .eq('id', id);
  if (error) console.error('Error toggling key:', error);
  else await addAuditLog(currentEnabled ? 'KEY_DISABLED' : 'KEY_ENABLED', key?.name || id);
}

export async function updateKeyIps(id: string, allowedIps: string[]) {
  const { data: key } = await supabase.from('api_keys').select('name').eq('id', id).single();
  const { error } = await supabase
    .from('api_keys')
    .update({ allowed_ips: allowedIps.length > 0 ? allowedIps : null })
    .eq('id', id);
  if (error) console.error('Error updating IPs:', error);
  else await addAuditLog('IP_WHITELIST_UPDATED', key?.name || id, `IPs: ${allowedIps.length > 0 ? allowedIps.join(', ') : 'None (open)'}`);
}

export async function validateAccessKey(key: string): Promise<ApiKey | null> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key', key)
    .eq('enabled', true)
    .single();
  if (error || !data) return null;
  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    await supabase.from('api_keys').update({ enabled: false }).eq('id', data.id);
    return null;
  }
  await supabase
    .from('api_keys')
    .update({ uses: (data.uses || 0) + 1 })
    .eq('id', data.id);
  return data;
}

// Check IP against whitelist (client-side check)
export async function checkIpWhitelist(apiKey: ApiKey): Promise<{ allowed: boolean; currentIp: string }> {
  if (!apiKey.allowed_ips || apiKey.allowed_ips.length === 0) {
    return { allowed: true, currentIp: 'Any' };
  }
  const { ip } = await getLocationInfo();
  return { allowed: apiKey.allowed_ips.includes(ip), currentIp: ip };
}

// Check and auto-disable all expired keys
export async function disableExpiredKeys(): Promise<void> {
  const { data } = await supabase
    .from('api_keys')
    .select('id, expires_at')
    .eq('enabled', true)
    .not('expires_at', 'is', null);
  if (!data) return;
  const now = new Date();
  const expired = data.filter(k => k.expires_at && new Date(k.expires_at) < now);
  for (const k of expired) {
    await supabase.from('api_keys').update({ enabled: false }).eq('id', k.id);
  }
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

export async function getLocationInfo(): Promise<{ ip: string; location: string }> {
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
  let locationInfo = { ip: 'Unknown', location: 'Unknown' };
  try { locationInfo = await getLocationInfo(); } catch {}

  const fullPayload = {
    key_name: log.keyName,
    endpoint: log.endpoint,
    query: log.query,
    status: log.status,
    device: getDeviceType(ua),
    browser: getBrowserName(ua),
    os: getOSName(ua),
    ip: locationInfo.ip,
    location: locationInfo.location,
  };

  const { error } = await supabase.from('search_logs').insert(fullPayload);
  if (error) {
    const { error: fallbackError } = await supabase.from('search_logs').insert({
      key_name: log.keyName,
      endpoint: log.endpoint,
      query: log.query,
      status: log.status,
    });
    if (fallbackError) console.error('Error adding log:', fallbackError);
  }
}

// API Health check
export async function checkEndpointHealth(endpoint: string): Promise<{ status: 'up' | 'down' | 'slow'; latency: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`${API_BASE}${endpoint}?test=healthcheck`, { signal: AbortSignal.timeout(8000) });
    const latency = Date.now() - start;
    if (!res.ok) return { status: 'down', latency };
    if (latency > 3000) return { status: 'slow', latency };
    return { status: 'up', latency };
  } catch {
    return { status: 'down', latency: Date.now() - start };
  }
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

// Broadcasts
export interface Broadcast {
  id: string;
  title: string;
  message: string;
  active: boolean;
  created_at: string;
}

export async function getBroadcasts(): Promise<Broadcast[]> {
  const { data, error } = await supabase
    .from('broadcasts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('Error fetching broadcasts:', error); return []; }
  return data || [];
}

export async function addBroadcast(title: string, message: string): Promise<Broadcast | null> {
  const { data, error } = await supabase
    .from('broadcasts')
    .insert({ title, message, active: true })
    .select()
    .single();
  if (error) { console.error('Error adding broadcast:', error); return null; }
  await addAuditLog('BROADCAST_CREATED', title, message.slice(0, 100));
  return data;
}

export async function toggleBroadcast(id: string, currentActive: boolean) {
  const { error } = await supabase
    .from('broadcasts')
    .update({ active: !currentActive })
    .eq('id', id);
  if (error) console.error('Error toggling broadcast:', error);
  else await addAuditLog(currentActive ? 'BROADCAST_DISABLED' : 'BROADCAST_ENABLED', id);
}

export async function deleteBroadcast(id: string) {
  const { data } = await supabase.from('broadcasts').select('title').eq('id', id).single();
  const { error } = await supabase.from('broadcasts').delete().eq('id', id);
  if (error) console.error('Error deleting broadcast:', error);
  else await addAuditLog('BROADCAST_DELETED', data?.title || id);
}

export async function getActiveBroadcasts(): Promise<Broadcast[]> {
  const { data, error } = await supabase
    .from('broadcasts')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error) { console.error('Error fetching active broadcasts:', error); return []; }
  return data || [];
}
