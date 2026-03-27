/**
 * AI caller — proxies through our secure Vercel serverless function.
 * The GROQ API key is NEVER sent to the browser.
 *
 * In development (localhost), falls back to direct Groq call if /api/chat is unavailable.
 */
const callProxy = async (payload, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            return data.choices?.[0]?.message?.content?.trim() ?? null;
        } catch (error) {
            console.error(`[callAI] Attempt ${i + 1} failed:`, error.message);
            if (i === retries - 1) throw error;
            await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
        }
    }
};

/**
 * Main AI caller.
 * @param {string} prompt - The user prompt.
 * @param {string} systemInstruction - The system prompt.
 * @param {boolean} expectJson - Whether to parse the response as JSON.
 * @param {object|null} jsonSchema - Optional JSON schema for the response format hint.
 */
export const callAI = async (prompt, systemInstruction = '', expectJson = false, jsonSchema = null) => {
    const messages = [
        { role: 'system', content: systemInstruction || 'You are a helpful assistant.' }
    ];

    if (expectJson && jsonSchema) {
        messages[0].content += `\nOutput MUST be in valid JSON format matching this schema: ${JSON.stringify(jsonSchema)}. Return ONLY the JSON object.`;
    } else if (expectJson) {
        messages[0].content += '\nReturn valid JSON only. Do not include markdown blocks.';
    }

    const safePrompt = typeof prompt === 'string' ? prompt : 'Please provide more information.';
    messages.push({ role: 'user', content: safePrompt || 'Hello' });

    const payload = {
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        stream: false,
        ...(expectJson ? { response_format: { type: 'json_object' } } : {}),
    };

    const text = await callProxy(payload);

    if (expectJson && text) {
        const cleanJson = text.replace(/^```json\s*|\s*```$/g, '');
        const parsed = JSON.parse(cleanJson);
        console.log('[callAI] Parsed JSON:', parsed);
        return parsed;
    }

    return text;
};

// Compatibility alias
export const callGemini = callAI;
