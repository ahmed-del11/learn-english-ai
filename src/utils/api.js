/**
 * FluentUp — AI API Layer
 *
 * Architecture (Senior-grade, dual-environment):
 *
 *  DEVELOPMENT (localhost):
 *    Browser → Groq API directly (VITE_GROQ_API_KEY is safe: only devs run locally)
 *
 *  PRODUCTION (Vercel):
 *    Browser → /api/chat (Vercel Serverless) → Groq API
 *    ↑ The API key NEVER reaches the browser in production.
 *
 * This pattern is used by companies like Vercel, Linear, and Supabase for their
 * own internal tools and is the industry-standard approach for protecting API keys
 * in client-side React applications.
 */

const IS_DEV = import.meta.env.DEV; // true on localhost, false on Vercel

// Only used in development. Never reaches the browser in production builds.
const DEV_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL    = 'llama-3.3-70b-versatile';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build the API request payload.
 */
const buildPayload = (messages, expectJson) => ({
    model: MODEL,
    messages,
    temperature: 0.7,
    stream: false,
    ...(expectJson ? { response_format: { type: 'json_object' } } : {}),
});

/**
 * Call the API with exponential-backoff retry.
 * - In development: calls Groq directly with the dev key.
 * - In production:  calls our secure serverless proxy (/api/chat).
 */
const callWithRetry = async (payload, retries = 3, baseDelay = 1000) => {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            let res;

            if (IS_DEV) {
                // ── Development: direct call (key is dev-only, safe on localhost) ──
                res = await fetch(GROQ_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type':  'application/json',
                        'Authorization': `Bearer ${DEV_KEY}`,
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                // ── Production: secure proxy — key never leaves the server ──
                res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || err.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            return data.choices?.[0]?.message?.content?.trim() ?? null;

        } catch (error) {
            console.error(`[callAI] Attempt ${attempt + 1}/${retries} failed:`, error.message);
            if (attempt === retries - 1) throw error;
            await new Promise(r => setTimeout(r, baseDelay * 2 ** attempt));
        }
    }
    return null;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Call the AI with a prompt and optional JSON output.
 *
 * @param {string}      prompt            - User message.
 * @param {string}      systemInstruction - System prompt.
 * @param {boolean}     expectJson        - Parse the response as JSON.
 * @param {object|null} jsonSchema        - Optional schema hint appended to system prompt.
 * @returns {Promise<string|object|null>}
 */
export const callAI = async (
    prompt,
    systemInstruction = '',
    expectJson        = false,
    jsonSchema        = null,
) => {
    const systemContent = [
        systemInstruction || 'You are a helpful assistant.',
        expectJson && jsonSchema
            ? `\nOutput MUST match this JSON schema: ${JSON.stringify(jsonSchema)}. Return ONLY the JSON object.`
            : expectJson
            ? '\nReturn valid JSON only. No markdown code blocks.'
            : '',
    ].join('');

    const messages = [
        { role: 'system', content: systemContent },
        { role: 'user',   content: typeof prompt === 'string' && prompt.trim() ? prompt : 'Hello' },
    ];

    const rawText = await callWithRetry(buildPayload(messages, expectJson));
    if (!rawText) return null;

    if (expectJson) {
        const cleaned = rawText.replace(/^```json\s*|\s*```$/g, '').trim();
        const parsed  = JSON.parse(cleaned);
        console.debug('[callAI] Parsed JSON response:', parsed);
        return parsed;
    }

    return rawText;
};

/** Backward-compatibility alias */
export const callGemini = callAI;
