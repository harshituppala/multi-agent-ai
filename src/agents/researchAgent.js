// src/agents/researchAgent.js
const axios = require('axios');

const WIKI_API_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const FALLBACK_TOPIC = 'General-purpose_AI';

const FILLER_WORDS = new Set([
    'explain', 'what', 'is', 'are', 'for', 'a', 'an', 'the', 'of', 'in', 'to',
    'how', 'do', 'i', 'get', 'started', 'beginners', 'learn', 'compare', 'vs',
    'overview', 'tell', 'me', 'about', 'please'
]);

const PRICE_WORDS = new Set(['cost', 'price', 'new', 'average', 'car', 'buy']);

/**
 * Normalize a phrase into a Wikipedia-style title:
 * - Trim
 * - Remove question marks
 * - Title-case words
 * - Join with underscores
 */
function normalizeTitle(phrase) {
    return phrase
        .trim()
        .replace(/[?]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('_');
}

/**
 * Improved topic extraction logic.
 * Handles common question patterns (e.g., "who is X", "what is Y"),
 * strips filler/price words, and biases toward the real subject noun(s).
 *
 * Examples:
 *  - "who is mahatma gandhi"     -> "Mahatma_Gandhi"
 *  - "what is the cost of a new elantra" -> "Elantra"
 */
function extractTopic(query) {
    if (!query || typeof query !== 'string') {
        return '';
    }

    const trimmed = query.trim();
    if (!trimmed) return '';

    const lower = trimmed.toLowerCase();

    // 1. Pattern-based extraction for "who/what is/was ..." and similar
    const patterns = [
        /^(who|what|where|when|why|how)\s+(is|was|are|were)\s+(.+)$/i,
        /^(tell me about)\s+(.+)$/i,
        /^(give me an overview of)\s+(.+)$/i
    ];

    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match) {
            const rawTopic = match[3] || match[2]; // pattern-dependent
            if (rawTopic) {
                let phrase = rawTopic.replace(/[?]/g, '').trim();

                // Token-level filtering to strip filler and price words
                const tokens = phrase
                    .toLowerCase()
                    .split(/\s+/)
                    .filter(Boolean);

                const keyTokens = tokens.filter(
                    t => !FILLER_WORDS.has(t) && !PRICE_WORDS.has(t)
                );

                if (keyTokens.length) {
                    // Bias toward the last 1–2 tokens (often the actual subject)
                    const finalTokens = keyTokens.slice(-2);
                    phrase = finalTokens.join(' ');
                }

                const normalized = normalizeTitle(phrase);
                if (normalized.length >= 3) {
                    return normalized;
                }
            }
        }
    }

    // 2. Keyword-based extraction as a general fallback
    const words = lower
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .filter(word => !FILLER_WORDS.has(word));

    // Remove generic price-related words to keep the main noun/topic
    const filtered = words.filter(w => !PRICE_WORDS.has(w));

    let candidate = filtered.length ? filtered : words;

    // If we still have multiple words, bias toward the last 1–2 words
    if (candidate.length >= 2) {
        candidate = candidate.slice(-2);
    }

    const extracted = candidate.join('_');

    if (extracted.length >= 3) {
        // Convert back to a title-style phrase for normalization
        return normalizeTitle(candidate.join(' '));
    }

    // 3. Final fallback: normalized original query
    console.warn('[Research] Extraction too short or failed. Falling back to normalized query.');
    return normalizeTitle(query);
}

/**
 * Calls the Wikipedia REST API to get a summary for a topic.
 * @param {string} topic The topic to search for.
 * @returns {Promise<object>} Structured research result.
 */
async function fetchWikiSummary(topic) {
    try {
        console.log(`[Research] Attempting to fetch summary for topic: ${topic}`);
        const url = `${WIKI_API_BASE}${encodeURIComponent(topic)}`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Multi-Agent-Orchestrator-App/1.0 (harshit.uppala.portfolio@example.com)'
            }
        });

        const data = response.data;

        // Wikipedia summary response format:
        // { title, displaytitle, pageid, extract, contentUrls: { desktop: { page: '...' } } }

        const result = {
            topic: data.title,
            source: 'wikipedia',
            ok: true,
            summary: data.extract, // Combined short description + extract
            url: data.content_urls ? data.content_urls.desktop.page : `https://en.wikipedia.org/wiki/${topic}`,
            raw: {
                pageid: data.pageid,
                thumbnail: data.thumbnail || null
            }
        };

        console.log(`[Research] Successfully fetched content for topic: ${data.title}`);
        return result;

    } catch (error) {
        let errorMessage = 'Network or unknown API error.';
        let httpStatus = 500;

        if (error.response) {
            httpStatus = error.response.status;
            if (httpStatus === 404) {
                errorMessage = `Topic not found on Wikipedia (HTTP ${httpStatus}).`;
            } else {
                errorMessage = `Wikipedia API returned error status ${httpStatus}.`;
            }
        } else if (error.request) {
            errorMessage = 'No response received from Wikipedia API.';
        }

        console.error(`[Research] Fetch failed for topic ${topic}: ${errorMessage}`);

        return {
            topic: topic,
            source: 'wikipedia',
            ok: false,
            summary: null,
            url: null,
            error: errorMessage
        };
    }
}


class ResearchAgent {
    /**
     * Executes the research task.
     * @param {string} query The user's question.
     * @returns {Promise<object>} The structured result from the Wikipedia API call.
     */
    async run(query) {
        const primaryTopic = extractTopic(query);
        let result = await fetchWikiSummary(primaryTopic);

        // Optional: If primary fetch fails, try a fallback topic (e.g., 'Artificial_intelligence')
        if (!result.ok && primaryTopic !== FALLBACK_TOPIC) {
            console.warn(`[Research] Primary topic failed. Trying fallback: ${FALLBACK_TOPIC}`);
            // This is just a conceptual fallback; for the portfolio, we'll return the failure.
            // result = await fetchWikiSummary(FALLBACK_TOPIC);
        }

        return result;
    }
}

module.exports = ResearchAgent;