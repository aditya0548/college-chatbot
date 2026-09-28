import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.scripts' });
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function count() {
  const { count, error } = await supabase.from('knowledge_base').select('*', { count: 'exact', head: true });
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Total rows in knowledge_base:", count);
  }
}
count();
