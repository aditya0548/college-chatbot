import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Try loading from .env.scripts first, then .env.local
dotenv.config({ path: '.env.scripts' });
dotenv.config({ path: '.env.local' });

// Environment variables needed:
// VITE_SUPABASE_URL (or SUPABASE_URL)
// SUPABASE_SERVICE_ROLE_KEY

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const dataPath = process.argv[2] || 'kb-seed-data.json';
  
  if (!fs.existsSync(dataPath)) {
    console.error(`Seed data file not found: ${dataPath}`);
    console.error(`Usage: node scripts/seed-kb.js [path/to/data.json]`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  console.log(`Read ${data.length} entries from ${dataPath}. Inserting into knowledge_base...`);
  
  const { error } = await supabase.from('knowledge_base').insert(data);
  
  if (error) {
    console.error("Error inserting data:", error);
    process.exit(1);
  } else {
    console.log("Seed data inserted successfully!");
  }
}

seed();
