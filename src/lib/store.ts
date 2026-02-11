// Local storage based key management for Akshu Portal

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  uses: number;
  enabled: boolean;
}

export interface SearchLog {
  id: string;
  keyName: string;
  endpoint: string;
  query: string;
  timestamp: string;
  status: 'success' | 'error';
}

const KEYS_STORAGE = 'akshu_keys';
const LOGS_STORAGE = 'akshu_logs';
const ADMIN_PASSWORD = 'stk7890';

// Initialize with default key
function initKeys(): ApiKey[] {
  const stored = localStorage.getItem(KEYS_STORAGE);
  if (stored) return JSON.parse(stored);
  const defaults: ApiKey[] = [
    {
      id: '1',
      name: 'Default User',
      key: 'test7890',
      createdAt: new Date().toISOString(),
      uses: 0,
      enabled: true,
    },
  ];
  localStorage.setItem(KEYS_STORAGE, JSON.stringify(defaults));
  return defaults;
}

export function getKeys(): ApiKey[] {
  return initKeys();
}

export function saveKeys(keys: ApiKey[]) {
  localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys));
}

export function addKey(name: string, key?: string): ApiKey {
  const keys = getKeys();
  const newKey: ApiKey = {
    id: Date.now().toString(),
    name,
    key: key || generateKey(),
    createdAt: new Date().toISOString(),
    uses: 0,
    enabled: true,
  };
  keys.push(newKey);
  saveKeys(keys);
  return newKey;
}

export function deleteKey(id: string) {
  const keys = getKeys().filter((k) => k.id !== id);
  saveKeys(keys);
}

export function toggleKey(id: string) {
  const keys = getKeys().map((k) => (k.id === id ? { ...k, enabled: !k.enabled } : k));
  saveKeys(keys);
}

export function validateAccessKey(key: string): ApiKey | null {
  const keys = getKeys();
  const found = keys.find((k) => k.key === key && k.enabled);
  if (found) {
    // increment uses
    const updated = keys.map((k) => (k.id === found.id ? { ...k, uses: k.uses + 1 } : k));
    saveKeys(updated);
  }
  return found || null;
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
export function getLogs(): SearchLog[] {
  const stored = localStorage.getItem(LOGS_STORAGE);
  return stored ? JSON.parse(stored) : [];
}

export function addLog(log: Omit<SearchLog, 'id' | 'timestamp'>) {
  const logs = getLogs();
  logs.unshift({ ...log, id: Date.now().toString(), timestamp: new Date().toISOString() });
  if (logs.length > 500) logs.length = 500;
  localStorage.setItem(LOGS_STORAGE, JSON.stringify(logs));
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
