const groqKey = import.meta.env.VITE_GROQ_API_KEY || "";

/**
 * Common AI caller for Groq API.
 * Uses OpenAI-compatible chat completions endpoint.
 */
export const callAI = async (prompt, systemInstruction = "", expectJson = false, jsonSchema = null) => {
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const messages = [
        { role: "system", content: systemInstruction || "You are a helpful assistant." }
    ];

    if (expectJson && jsonSchema) {
        messages[0].content += `\nOutput MUST be in valid JSON format matching this schema: ${JSON.stringify(jsonSchema)}. Return ONLY the JSON object.`;
    } else if (expectJson) {
        messages[0].content += "\nReturn valid JSON only. Do not include markdown blocks.";
    }

    const safePrompt = typeof prompt === 'string' ? prompt : "Please provide more information.";
    messages.push({ role: "user", content: safePrompt || "Hello" });

    const payload = {
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.7,
        stream: false
    };

    if (expectJson) {
        payload.response_format = { type: "json_object" };
    }

    const fetchWithRetry = async (retries = 3, delay = 1000) => {
        for (let i = 0; i < retries; i++) {
            try {
                const res = await fetch(url, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${groqKey}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(`Groq API error: ${errorData.error?.message || res.statusText}`);
                }

                const data = await res.json();
                const text = data.choices?.[0]?.message?.content?.trim();
                console.log("Groq AI Raw Response:", text);

                if (expectJson) {
                    const cleanJson = text.replace(/^```json\s*|\s*```$/g, "");
                    const parsed = JSON.parse(cleanJson);
                    console.log("Groq AI Parsed JSON:", parsed);
                    return parsed;
                }
                return text;
            } catch (error) {
                console.error("AI Fetch error:", error);
                if (i === retries - 1) throw error;
                await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
            }
        }
    };

    return fetchWithRetry();
};

// Compatibility alias
export const callGemini = callAI;
