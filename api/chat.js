import { searchKB, getKBContext } from '../src/lib/kb.js';

async function callGeminiWithTimeout(model, contents, apiKey, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return { ok: false, data: { error: { message: 'Gemini timed out after 10s', code: 'TIMEOUT' } } };
    }
    return { ok: false, data: { error: { message: err.message, code: 'FETCH_ERROR' } } };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [] } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  // 1. Try KB first
  const kbMatch = await searchKB(message);
  if (kbMatch) {
    return res.status(200).json({
      reply: kbMatch.answer,
      source: 'kb',
      category: kbMatch.category,
    });
  }

  // 2. No strong match — get context for Gemini
  const kbContext = await getKBContext(message);

  // Build context string for the AI
  const contextBlock = kbContext.length > 0
    ? `\n\nRelevant information from our college knowledge base (use this if applicable, but don't invent facts):\n\n${kbContext.map(e => `• ${e.category}: ${e.answer}`).join('\n')}`
    : '';

  // 3. Append context to system prompt
  const SYSTEM = `You are ACA47, the official assistant for BPHE Society's Ahmednagar College (est. 1947, SPPU affiliated, motto 'Not Things but Men'). Answer student questions about admissions, courses, fees, hostel, faculty, scholarships, and campus life.

Rules:
- Keep answers concise (under 120 words unless the question requires more).
- If you don't know something, say so and suggest contacting the college: 0241-2359571, ahmednagarcollege1947@gmail.com
- Never invent facts about the college.
- Tone: warm, helpful, respectful.${contextBlock}`;

  const contents = [
    { role: 'user', parts: [{ text: SYSTEM }] },
    { role: 'model', parts: [{ text: 'Understood. I am ACA47.' }] },
    ...history.map(h => ({
      role: h.role === 'assistant' || h.role === 'bot' ? 'model' : 'user',
      parts: [{ text: h.content }]
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  try {
    console.log('Attempting primary model: gemini-3.5-flash-lite');
    let result = await callGeminiWithTimeout('gemini-3.5-flash-lite', contents, apiKey);
    
    if (!result.ok && result.data?.error?.code === 503) {
      console.warn('gemini-3.5-flash-lite returned 503, waiting 1000ms and retrying...');
      await new Promise(r => setTimeout(r, 1000));
      result = await callGeminiWithTimeout('gemini-3.5-flash-lite', contents, apiKey);
    }
    
    if (!result.ok) {
      console.warn(`gemini-3.5-flash-lite failed: ${result.data?.error?.message || 'unknown error'}, falling back to gemini-3.5-flash...`);
      result = await callGeminiWithTimeout('gemini-3.5-flash', contents, apiKey);
    }
    
    if (!result.ok) {
      console.warn(`gemini-3.5-flash failed: ${result.data?.error?.message || 'unknown error'}, falling back to gemini-3.6-flash...`);
      result = await callGeminiWithTimeout('gemini-3.6-flash', contents, apiKey);
    }
    
    if (!result.ok) {
      console.error('All models failed:', result.data);
      return res.status(200).json({
        reply: "I'm having trouble reaching my knowledge service right now. Please try again, or contact the college at **0241-2359571**.",
        source: 'fallback'
      });
    }

    console.log('Successfully generated response.');
    const reply = result.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a reply.';
    return res.status(200).json({ reply, source: 'ai' });
  } catch (err) {
    console.error('Server exception:', err.message, err.stack);
    return res.status(500).json({ error: 'Server error' });
  }
}
