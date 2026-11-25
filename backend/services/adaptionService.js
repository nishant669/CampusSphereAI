const ADAPTION_URL =
  "https://api.prod.adaptionlabs.ai/api/v1/chat/completions";

async function callAdaption(messages) {
  const apiKey = process.env.ADAPTION_API_KEY;
  const model = process.env.ADAPTION_MODEL || "qwen3.5-397b";

  if (!apiKey) {
    throw new Error("ADAPTION_API_KEY is missing");
  }

  const response = await fetch(ADAPTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1200,
    }),
    signal: AbortSignal.timeout(
      Number(process.env.AI_TIMEOUT) || 30000
    ),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Adaption API error ${response.status}: ${
        data.error?.message || JSON.stringify(data)
      }`
    );
  }

  const answer = data.choices?.[0]?.message?.content;

  if (!answer) {
    throw new Error("Adaption returned an empty response");
  }

  return answer;
}

module.exports = { callAdaption };