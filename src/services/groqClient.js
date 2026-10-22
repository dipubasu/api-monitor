const config = require("../config");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callGroq(prompt) {
  if (!config.groq.apiKey) {
    throw new Error("GROQ_API_KEY is not set.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.groq.apiKey}`,
    },
    body: JSON.stringify({
      model: config.groq.model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const message = data.choices && data.choices[0] && data.choices[0].message;

  if (!message || !message.content) {
    throw new Error("Groq API returned an unexpected response shape.");
  }

  return message.content.trim();
}

module.exports = { callGroq };