/**
 * Vercel Serverless Function — /api/chat
 * Proxies requests to Groq API, keeping the API key secure on the server.
 * The key is NEVER sent to the browser.
 */
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
        return res.status(500).json({ error: 'Server configuration error: API key missing.' });
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`,
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || 'Groq API error' });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('[/api/chat] Proxy error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
