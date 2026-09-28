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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );

    let data = await response.json();
    
    // Fallback if model fails (e.g., 404 or not found)
    if (!response.ok && data.error?.code === 404) {
      const fallbackResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        }
      );
      data = await fallbackResponse.json();
      if (!fallbackResponse.ok) {
        console.error('Gemini fallback error:', data);
        return res.status(500).json({ error: 'AI error' });
      }
    } else if (!response.ok) {
      console.error('Gemini error:', data);
      return res.status(500).json({ error: 'AI error' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a reply.';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
