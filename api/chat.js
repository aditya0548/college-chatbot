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

  const SYSTEM = `You are ACA47, the official assistant for BPHE Society's Ahmednagar College (est. 1947, SPPU affiliated, motto 'Not Things but Men'). Answer student questions about admissions, courses, fees, hostel, faculty, scholarships, and campus life.

Rules:
- Keep answers concise (under 120 words unless the question requires more).
- If you don't know something, say so and suggest contacting the college: 0241-2359571, ahmednagarcollege1947@gmail.com
- Never invent facts about the college.
- Tone: warm, helpful, respectful.`;

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
    let response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );
    let data = await response.json();
    
    // First fallback: gemini-3.5-flash
    if (!response.ok && data.error?.code === 404) {
      console.warn('gemini-3.6-flash returned 404, falling back to gemini-3.5-flash...');
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        }
      );
      data = await response.json();
    }

    // Second fallback: gemini-3.5-flash-lite
    if (!response.ok && data.error?.code === 404) {
      console.warn('gemini-3.5-flash returned 404, falling back to gemini-3.5-flash-lite...');
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        }
      );
      data = await response.json();
    }

    if (!response.ok) {
      console.error('Gemini API Error:', JSON.stringify(data, null, 2));
      return res.status(500).json({ error: 'AI error' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a reply.';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Server exception:', err.message, err.stack);
    return res.status(500).json({ error: 'Server error' });
  }
}
