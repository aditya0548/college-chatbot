import { supabase } from './supabase.js';

// Simple keyword extractor
function extractKeywords(text) {
  const stopwords = new Set(['the', 'is', 'a', 'an', 'of', 'to', 'and', 'or', 'for', 'in', 'on', 'at', 'what', 'how', 'when', 'where', 'why', 'can', 'i', 'you', 'me', 'my', 'do', 'does', 'are', 'about', 'tell', 'give', 'me']);
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));
}

// Search KB for a matching answer
export async function searchKB(question) {
  const keywords = extractKeywords(question);
  if (keywords.length === 0) return null;

  // Find entries where ANY keyword overlaps with question_patterns
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .overlaps('question_patterns', keywords)
    .limit(5);

  if (error || !data || data.length === 0) return null;

  // Score by number of matches, pick the best
  const scored = data.map(entry => ({
    entry,
    score: keywords.filter(k => entry.question_patterns.includes(k)).length,
  }));

  const feeKeywords = ['fee', 'fees', 'cost', 'kitna', 'price', 'charge'];
  const courseCodes = ['bca', 'bsc', 'ba', 'bcom', 'ma', 'msc', 'mcom', 'bba'];
  const questionLower = question.toLowerCase();
  const hasFeeKeyword = feeKeywords.some(k => questionLower.includes(k));
  const hasCourseCode = courseCodes.some(c => questionLower.includes(c));

  const sorted = scored.sort((a, b) => {
    // If the question is fee-related and has a course code, prioritize Fees categories
    if (hasFeeKeyword && hasCourseCode) {
      const aIsFee = a.entry.category.startsWith('Fees');
      const bIsFee = b.entry.category.startsWith('Fees');
      if (aIsFee && !bIsFee) return -1;
      if (!aIsFee && bIsFee) return 1;
    }
    // Otherwise use existing logic: score, then updated_at
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.entry.updated_at) - new Date(a.entry.updated_at);
  });

  const best = sorted[0];
  // Require at least 1 keyword match to consider it a "strong" hit
  if (best.score < 1) return null;

  return best.entry;
}

// Get top N KB entries for context (for Gemini fallback)
export async function getKBContext(question, limit = 3) {
  const keywords = extractKeywords(question);
  if (keywords.length === 0) return [];

  const { data } = await supabase
    .from('knowledge_base')
    .select('category, answer, question_patterns')
    .overlaps('question_patterns', keywords)
    .limit(limit);

  return data || [];
}
