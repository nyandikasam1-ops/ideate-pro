// netlify/functions/enhance.js
//
// This function runs on Netlify's servers, NOT in the browser.
// It holds your GROQ_API_KEY secret and forwards requests to Groq.
// The frontend calls THIS function instead of calling Groq directly.

const JSON_HEADERS = { "Content-Type": "application/json" };

exports.handler = async function (event) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        error: "Server is missing GROQ_API_KEY. Set it in Netlify env vars.",
      }),
    };
  }

  // event.body can be null/undefined if the request body is empty —
  // guard before calling JSON.parse on it.
  if (!event.body) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: "Empty request body" }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const { systemPrompt, userInput } = payload || {};

  if (!userInput || typeof userInput !== "string") {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: "Missing userInput" }),
    };
  }

  try {
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          // llama-3.3-70b-versatile is Groq's strongest general model as of writing.
          // Swap to "llama-3.1-8b-instant" for even faster/cheaper if quality is sufficient.
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          temperature: 0.7,
          messages: [
            { role: "system", content: systemPrompt || "" },
            { role: "user", content: userInput },
          ],
        }),
      }
    );

    // Read the response as raw text first. Groq should always return JSON,
    // but if Groq itself ever returns an empty body (rate limit edge cases,
    // gateway errors, etc.) calling .json() directly would throw and crash
    // this function before it can return anything — which is exactly the
    // "Unexpected end of JSON input" symptom seen in the browser.
    const rawText = await groqResponse.text();

    let data;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (parseErr) {
      return {
        statusCode: 502,
        headers: JSON_HEADERS,
        body: JSON.stringify({
          error: "Groq returned a non-JSON response: " + rawText.slice(0, 200),
        }),
      };
    }

    if (!groqResponse.ok) {
      return {
        statusCode: groqResponse.status,
        headers: JSON_HEADERS,
        body: JSON.stringify({
          error: data.error?.message || "Groq API error",
        }),
      };
    }

    const text = data.choices?.[0]?.message?.content || "";

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({ text }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: "Failed to reach Groq: " + err.message }),
    };
  }
};
