const fetch = global.fetch;

exports.chat = async (req, res) => {
  const message = String(req.body.message || '').trim();
  if (!message || message.length > 2000) return res.status(400).json({ message: 'Enter a message (maximum 2000 characters).' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({
    message: 'AI assistant is not configured yet. Add GROQ_API_KEY to backend/.env. The key must remain on the server.'
  });

  try {
    const response = await fetch(process.env.LLM_API_URL || 'https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are CampusSphere AI, a helpful college academic and placement assistant. Help with RGPV exam preparation, study planning, programming concepts, assignments and placement preparation. Be clear when you do not know an official paper link or college-specific fact. Never invent official links, marks, deadlines or policies. Encourage students to verify university notices.' },
          { role: 'user', content: message }
        ],
        temperature: 0.4,
        max_tokens: 700
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ message: data.error?.message || 'The AI provider could not complete the request.' });
    res.json({ reply: data.choices?.[0]?.message?.content || 'I could not generate a response. Please try again.' });
  } catch (e) {
    res.status(502).json({ message: 'Could not reach the AI provider. Check your backend network connection.' });
  }
};
