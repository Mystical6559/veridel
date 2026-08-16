
const MODEL = "grok-4.6";
const RETRIES = 2;
const RETRY_DELAY_MS = 600;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


function toGrokMessages(messages) {
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

    
    for (const tr of toolResults) {
      out.push({
        role: "tool",
        tool_call_id: tr.tool_use_id,
        content: typeof tr.content === "string" ? tr.content : JSON.stringify(tr.content),
      });
    }

    // Text and/or tool_use blocks become one assistant/user message.
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

// Anthropic-style tool schema (name/description/input_schema) -> OpenAI's
// function-calling schema (name/description/parameters). Both use plain
// JSON Schema for the parameters, so this is a direct field rename.
function toGrokTools(tools) {
  if (!Array.isArray(tools) || tools.length === 0) return undefined;
  return tools.map((tl) => ({
    type: "function",
    function: {
      name: tl.name,
      description: tl.description,
      parameters: tl.input_schema,
    },
  }));
}

async function callGrokWithRetries(apiKey, body) {
  let lastError = null;

  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (grokRes.ok) {
      return { grokRes, data: await grokRes.json() };
    }

    const data = await grokRes.json().catch(() => ({}));
    lastError = { grokRes, data };

    // Only rate-limit/overload responses are worth retrying — anything else
    // (bad request, auth, etc.) will fail the same way every time.
    if (grokRes.status !== 429 && grokRes.status !== 503) {
      return lastError;
    }

    if (attempt < RETRIES) {
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  return lastError;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "Method not allowed" } });
    return;
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: {
        message:
          "XAI_API_KEY is not set on the server. Add it in Vercel -> Settings -> Environment Variables, then redeploy.",
      },
    });
    return;
  }

  const { system, messages, tools, max_tokens } = req.body || {};
  if (!messages) {
    res.status(400).json({ error: { message: "Missing 'messages' in request body." } });
    return;
  }

  const grokMessages = [
    ...(system ? [{ role: "system", content: system }] : []),
    ...toGrokMessages(messages),
  ];
  const grokTools = toGrokTools(tools);

  try {
    const { grokRes, data } = await callGrokWithRetries(apiKey, {
      model: MODEL,
      messages: grokMessages,
      tools: grokTools,
      max_tokens: max_tokens || 1000,
    });

    if (!grokRes.ok) {
      console.error("Grok error:", data);
      const friendly =
        grokRes.status === 429 || grokRes.status === 503
          ? "V's model is under heavy load right now. Please try again in a moment."
          : data?.error?.message || "Grok request failed";
      res.status(grokRes.status).json({ error: { message: friendly } });
      return;
    }

    const message = data?.choices?.[0]?.message || {};
    const content = [];

    if (message.content) {
      content.push({ type: "text", text: message.content });
    }
    if (Array.isArray(message.tool_calls)) {
      for (const tc of message.tool_calls) {
        let input = {};
        try {
          input = JSON.parse(tc.function.arguments || "{}");
        } catch (e) {
          console.error("Failed to parse tool call arguments:", tc.function.arguments);
        }
        content.push({ type: "tool_use", id: tc.id, name: tc.function.name, input });
      }
    }

    // Normalize to the shape App.jsx already parses.
    res.status(200).json({ content });
  } catch (err) {
    console.error("Grok proxy error:", err);
    res.status(500).json({ error: { message: "Server error contacting Grok." } });
  }
}
