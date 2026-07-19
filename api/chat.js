// Vercel serverless function: POST /api/chat
// FREE alternative to api/chat.js — uses Google's Gemini API free tier
// instead of the paid Anthropic API. As of mid-2026, Gemini's free tier
// gives ~1,500 requests/day on Gemini Flash, no credit card required.
//
// This returns a response in the same shape the frontend already expects
// ({ content: [{ text }] }), so you do NOT need to touch study-planner.jsx —
// just swap this file in as api/chat.js.
//
// Setup:
// 1. Get a free key at https://aistudio.google.com/apikey (Google account only)
// 2. In Vercel → Settings → Environment Variables, add:
//      GEMINI_API_KEY = AIza...
// 3. Save this file as api/chat.js (replacing the Anthropic version), then redeploy.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "Method not allowed" } });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: {
        message:
          "GEMINI_API_KEY is not set on the server. Add it in Vercel → Settings → Environment Variables, then redeploy.",
      },
    });
    return;
  }

  const { system, messages } = req.body || {};
  if (!messages) {
    res.status(400).json({ error: { message: "Missing 'messages' in request body." } });
    return;
  }

  // Anthropic-style {role: "user"|"assistant", content} -> Gemini-style
  // {role: "user"|"model", parts: [{text}]}
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          generationConfig: { maxOutputTokens: 1000 },
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("Gemini error:", data);
      res.status(geminiRes.status).json({ error: { message: data?.error?.message || "Gemini request failed" } });
      return;
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";

    // Normalize to the same shape study-planner.jsx already parses.
    res.status(200).json({ content: [{ type: "text", text }] });
  } catch (err) {
    console.error("Gemini proxy error:", err);
    res.status(500).json({ error: { message: "Server error contacting Gemini." } });
  }
}
