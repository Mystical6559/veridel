

const GEMINI_MODELS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"];
const GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
const RETRIES_PER_MODEL = 2;
const RETRY_DELAY_MS = 600;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));



function toGeminiContents(messages) {
  return messages.map((m) => {
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


    const role = hasFunctionResponse ? "user" : m.role === "assistant" ? "model" : "user";
    return { role, parts };
  });
}

function toGeminiTools(tools) {
  if (!Array.isArray(tools) || tools.length === 0) return undefined;
  return [
    {
      functionDeclarations: tools.map((tl) => ({
        name: tl.name,
        description: tl.description,
        parameters: tl.input_schema,
      })),
    },
  ];
}

async function callGeminiWithRetries(apiKey, body) {
  let lastError = null;

  for (const model of GEMINI_MODELS) {
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

     
      if (geminiRes.status !== 503) {
        return lastError;
      }
      if (attempt < RETRIES_PER_MODEL) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  return lastError;
}

async function tryGemini(apiKey, { system, messages, tools }) {
  const body = {
    contents: toGeminiContents(messages),
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    tools: toGeminiTools(tools),
    generationConfig: { maxOutputTokens: 1000 },
  };

  const { geminiRes, data, model } = await callGeminiWithRetries(apiKey, body);

  if (!geminiRes.ok) {
    console.warn(`Gemini failed (model: ${model}), status ${geminiRes.status}:`, data);
    return { ok: false, status: geminiRes.status, data };
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

  return { ok: true, content };
}



function toOpenAIMessages(messages) {
  const out = [];

  for (const m of messages) {
    if (typeof m.content === "string") {
      out.push({ role: m.role, content: m.content });
      continue;
    }

    const blocks = Array.isArray(m.content) ? m.content : [];
    const toolResults = blocks.filter((b) => b.type === "tool_result");
    const textBlocks = blocks.filter((b) => b.type === "text");
    const toolUseBlocks = blocks.filter((b) => b.type === "tool_use");

    // Each tool_result becomes its own "tool" role message.
    for (const tr of toolResults) {
      out.push({
        role: "tool",
        tool_call_id: tr.tool_use_id,
        content: typeof tr.content === "string" ? tr.content : JSON.stringify(tr.content),
      });
    }

    if (textBlocks.length > 0 || toolUseBlocks.length > 0) {
      const msg = { role: m.role === "assistant" ? "assistant" : "user" };
      const text = textBlocks.map((b) => b.text || "").join("\n");

      if (toolUseBlocks.length > 0) {
        msg.content = text || null;
        msg.tool_calls = toolUseBlocks.map((tu) => ({
          id: tu.id,
          type: "function",
          function: { name: tu.name, arguments: JSON.stringify(tu.input || {}) },
        }));
      } else {
        msg.content = text;
      }
      out.push(msg);
    }
  }

  return out;
}

function toOpenAITools(tools) {
  if (!Array.isArray(tools) || tools.length === 0) return undefined;
  return tools.map((tl) => ({
    type: "function",
    function: { name: tl.name, description: tl.description, parameters: tl.input_schema },
  }));
}

async function callOpenAICompatWithRetries(url, apiKey, baseBody, models) {
  let lastError = null;

  for (const model of models) {
    for (let attempt = 0; attempt <= RETRIES_PER_MODEL; attempt++) {
      const apiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ ...baseBody, model }),
      });

      if (apiRes.ok) {
        return { apiRes, data: await apiRes.json(), model };
      }

      const data = await apiRes.json().catch(() => ({}));
      lastError = { apiRes, data, model };

      if (apiRes.status !== 429 && apiRes.status !== 503) {
        return lastError;
      }
      if (attempt < RETRIES_PER_MODEL) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  return lastError;
}

async function tryGroq(apiKey, { system, messages, tools, max_tokens }) {
  const openaiMessages = [
    ...(system ? [{ role: "system", content: system }] : []),
    ...toOpenAIMessages(messages),
  ];

  const { apiRes, data, model } = await callOpenAICompatWithRetries(
    "https://api.groq.com/openai/v1/chat/completions",
    apiKey,
    { messages: openaiMessages, tools: toOpenAITools(tools), max_tokens: max_tokens || 1000 },
    GROQ_MODELS
  );

  if (!apiRes.ok) {
    console.warn(`Groq failed (model: ${model}), status ${apiRes.status}:`, data);
    return { ok: false, status: apiRes.status, data };
  }

  const message = data?.choices?.[0]?.message || {};
  const content = [];

  if (message.content) content.push({ type: "text", text: message.content });
  if (Array.isArray(message.tool_calls)) {
    for (const tc of message.tool_calls) {
      let input = {};
      try {
        input = JSON.parse(tc.function.arguments || "{}");
      } catch (e) {
        console.error("Failed to parse Groq tool call arguments:", tc.function.arguments);
      }
      content.push({ type: "tool_use", id: tc.id, name: tc.function.name, input });
    }
  }

  return { ok: true, content };
}



export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "Method not allowed" } });
    return;
  }

  const { system, messages, tools, max_tokens } = req.body || {};
  if (!messages) {
    res.status(400).json({ error: { message: "Missing 'messages' in request body." } });
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!geminiKey && !groqKey) {
    res.status(500).json({
      error: {
        message:
          "Neither GEMINI_API_KEY nor GROQ_API_KEY is set on the server. Add at least one in Vercel -> Settings -> Environment Variables, then redeploy.",
      },
    });
    return;
  }

 
  if (geminiKey) {
    try {
      const result = await tryGemini(geminiKey, { system, messages, tools });
      if (result.ok) {
        res.status(200).json({ content: result.content });
        return;
      }
      console.warn("Gemini failed — falling back to Groq if available.");
    } catch (err) {
      console.error("Gemini proxy error:", err);
    }
  }

 
  if (groqKey) {
    try {
      const result = await tryGroq(groqKey, { system, messages, tools, max_tokens });
      if (result.ok) {
        res.status(200).json({ content: result.content });
        return;
      }
      const friendly =
        result.status === 429
          ? "V is getting a lot of requests right now on both providers. Please try again shortly."
          : result.data?.error?.message || "Groq request failed";
      res.status(result.status || 500).json({ error: { message: friendly } });
      return;
    } catch (err) {
      console.error("Groq proxy error:", err);
      res.status(500).json({ error: { message: "Server error contacting Groq." } });
      return;
    }
  }

 
  res.status(502).json({
    error: {
      message: "V's model is unavailable right now, and no backup provider is configured.",
    },
  });
}
