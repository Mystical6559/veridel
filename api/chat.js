
const MODEL_FALLBACKS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"];
const RETRIES_PER_MODEL = 2;
const RETRY_DELAY_MS = 600;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGeminiWithRetries(apiKey, body) {
  let lastError = null;

  for (const model of MODEL_FALLBACKS) {
    for (let attempt = 0; attempt <= RETRIES_PER_MODEL; attempt++) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (geminiRes.ok) {
        return { geminiRes, data: await geminiRes.json(), model };
      }

      const data = await geminiRes.json().catch(() => ({}));
      lastError = { geminiRes, data, model };

      // Only 503 (overloaded) is worth retrying / falling back on. Anything
      // else (bad request, auth, etc.) would fail the same way every time.
      if (geminiRes.status !== 503) {
        return lastError;
      }

      if (attempt < RETRIES_PER_MODEL) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
    // Exhausted retries on this model while overloaded — try the next model.
  }

  return lastError;
}

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

  const { system, messages, tools } = req.body || {};
  if (!messages) {
    res.status(400).json({ error: { message: "Missing 'messages' in request body." } });
    return;
  }

  // Anthropic-style {role, content} -> Gemini-style {role, parts}.
  const contents = messages.map((m) => {
    if (typeof m.content === "string") {
      return { role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] };
    }

    const blocks = Array.isArray(m.content) ? m.content : [];
    const hasFunctionResponse = blocks.some((b) => b.type === "tool_result");

    const parts = blocks.map((block) => {
      if (block.type === "tool_use") {
        return { functionCall: { name: block.name, args: block.input || {} } };
      }
      if (block.type === "tool_result") {
        return {
          functionResponse: {
            name: block.name || "tool",
            response: {
              result: typeof block.content === "string" ? block.content : JSON.stringify(block.content),
            },
          },
        };
      }
      return { text: block.text || "" };
    });

    // Gemini expects functionResponse parts to sit on a "function"-role turn.
    const role = hasFunctionResponse ? "function" : m.role === "assistant" ? "model" : "user";
    return { role, parts };
  });

  // Anthropic-style tool schema (name/description/input_schema) maps almost
  // directly onto Gemini's functionDeclarations (name/description/parameters) —
  // both use plain JSON Schema.
  const geminiTools =
    Array.isArray(tools) && tools.length > 0
      ? [
          {
            functionDeclarations: tools.map((tl) => ({
              name: tl.name,
              description: tl.description,
              parameters: tl.input_schema,
            })),
          },
        ]
      : undefined;

  try {
    const { geminiRes, data, model } = await callGeminiWithRetries(apiKey, {
      contents,
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      tools: geminiTools,
      generationConfig: { maxOutputTokens: 1000 },
    });

    if (!geminiRes.ok) {
      console.error(`Gemini error (model: ${model}):`, data);
      const friendly =
        geminiRes.status === 503
          ? "V's model is under heavy load right now on Google's side. Please try again in a moment."
          : data?.error?.message || "Gemini request failed";
      res.status(geminiRes.status).json({ error: { message: friendly } });
      return;
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    let callId = 0;
    const content = parts
      .map((p) => {
        if (p.functionCall) {
          callId += 1;
          return {
            type: "tool_use",
            id: `call_${Date.now()}_${callId}`,
            name: p.functionCall.name,
            input: p.functionCall.args || {},
          };
        }
        if (typeof p.text === "string" && p.text) {
          return { type: "text", text: p.text };
        }
        return null;
      })
      .filter(Boolean);

    // Normalize to the shape study-planner code already parses.
    res.status(200).json({ content });
  } catch (err) {
    console.error("Gemini proxy error:", err);
    res.status(500).json({ error: { message: "Server error contacting Gemini." } });
  }
}

