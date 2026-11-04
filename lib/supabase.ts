import { createClient } from '@/utils/supabase/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl) {
  console.warn(
    '⚠️  NEXT_PUBLIC_SUPABASE_URL is not set. Please add it to your .env.local file to enable Supabase features.'
  );
}
if (!supabasePublishableKey) {
  console.warn(
    '⚠️  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is not set. Please add it to your .env.local file to enable Supabase features.'
  );
}

export const supabase = createClient();
