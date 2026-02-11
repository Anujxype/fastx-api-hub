import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kbgabcennwwfmykfyndh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ2FiY2Vubnd3Zm15a2Z5bmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTE5NjYsImV4cCI6MjA4NjE4Nzk2Nn0.CzvobFl6D2tyRPA9JNW8yEZ9PhkrtkzsAhEvyhKtj4I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
