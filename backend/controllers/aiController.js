
const { callAdaption } = require("../services/adaptionService");

const SYSTEM_PROMPT = `You are CampusSphere AI, a helpful college academic assistant.

Help students with:
1. Programming and coding
2. DSA and interview preparation
3. RGPV examination preparation
4. SQL and database concepts
5. Study plans
6. Assignments and practicals
7. Aptitude and placement preparation
8. College-related academic questions

Explain answers clearly and step-by-step.
Use beginner-friendly language.
Never invent official notices, deadlines or college policies.`;

const TIMEOUT = Number(process.env.AI_TIMEOUT) || 30000;

const getKeys = (variable) =>
  (process.env[variable] || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

async function readResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Invalid API response: ${text.slice(0, 300)}`);
  }
}

// ------------------------------------
// GEMINI PROVIDER
// ------------------------------------
async function callGemini(message, apiKey) {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: AbortSignal.timeout(TIMEOUT),
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: message }],
          },
        ],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1200,
        },
      }),
    }
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      data.error?.message || `Gemini HTTP ${response.status}`
    );
  }

  const reply = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!reply) {
    throw new Error("Gemini returned an empty response");
  }

  return reply;
}

// ------------------------------------
// GROQ PROVIDER
// ------------------------------------
async function callGroq(message, apiKey) {
  const url =
    process.env.LLM_API_URL ||
    "https://api.groq.com/openai/v1/chat/completions";

  const model =
    process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(TIMEOUT),
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      temperature: 0.5,
      max_tokens: 1200,
    }),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      data.error?.message || `Groq HTTP ${response.status}`
    );
  }

  const reply = data.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    throw new Error("Groq returned an empty response");
  }

  return reply;
}

// ------------------------------------
// MAIN CHAT CONTROLLER
// Priority: Gemini -> Groq -> Adaption
// ------------------------------------
const chat = async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message || message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Enter a message (maximum 2000 characters).",
      });
    }

    const geminiKeys = getKeys("GEMINI_API_KEYS");
    const groqKeys = getKeys("GROQ_API_KEYS");

    // 1. Try all Gemini keys
    for (let i = 0; i < geminiKeys.length; i++) {
      try {
        console.log(`Trying Gemini key ${i + 1}...`);

        const reply = await callGemini(message, geminiKeys[i]);

        console.log("Gemini succeeded.");

        return res.status(200).json({
          success: true,
          reply,
          provider: "Gemini",
        });
      } catch (error) {
        console.error(`Gemini key ${i + 1} failed:`, error.message);
      }
    }

    // 2. Try all Groq keys
    for (let i = 0; i < groqKeys.length; i++) {
      try {
        console.log(`Trying Groq key ${i + 1}...`);

        const reply = await callGroq(message, groqKeys[i]);

        console.log("Groq succeeded.");

        return res.status(200).json({
          success: true,
          reply,
          provider: "Groq",
        });
      } catch (error) {
        console.error(`Groq key ${i + 1} failed:`, error.message);
      }
    }

    // 3. Try Adaption
    try {
      console.log("Switching to Adaption AI...");

      const reply = await callAdaption([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ]);

      console.log("Adaption succeeded.");

      return res.status(200).json({
        success: true,
        reply,
        provider: "Adaption",
      });
    } catch (error) {
      console.error("Adaption failed:", error.message);
    }

    // All providers failed
    return res.status(502).json({
      success: false,
      message: "All AI providers are currently unavailable. Please try again later.",
    });

  } catch (error) {
    console.error("CampusSphere AI controller error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal chatbot error.",
    });
  }
};

module.exports = { chat };
