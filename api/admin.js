import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Common headers for CORS if needed, but not strictly required for same-origin
  const password = req.headers['authorization']?.replace('Bearer ', '');
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_PASSWORD' });
  }

  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server misconfigured: missing Supabase keys' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ entries: data });
  }

  if (req.method === 'POST') {
    const { category, question_patterns, answer, confidence, source } = req.body;
    if (!category || !question_patterns || !answer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert([{ category, question_patterns, answer, confidence, source }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ entry: data });
  }

  if (req.method === 'PATCH') {
    const { id, category, question_patterns, answer, confidence, source } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing entry id' });

    const { data, error } = await supabase
      .from('knowledge_base')
      .update({ category, question_patterns, answer, confidence, source, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ entry: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing entry id' });

    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
