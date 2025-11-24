// src/agents/analysisAgent.js

const ADVANCED_WORDS = new Set([
    'cluster', 'orchestration', 'distributed', 'concurrency', 'containerization',
    'scalability', 'stateless', 'latency', 'asynchronous', 'pipeline', 'microservices'
]);

const BEGINNER_WORDS = new Set([
    'introduction', 'basic', 'getting started', 'simple', 'fundamental', 'beginner'
]);

/**
 * Estimates the difficulty level of the content.
 * @param {string} summary The text summary.
 * @returns {'beginner' | 'intermediate' | 'intermediate-advanced' | 'unknown'}
 */
function inferDifficulty(summary) {
    const lowerSummary = summary.toLowerCase();

    // Check for advanced words
    let advancedCount = 0;
    ADVANCED_WORDS.forEach(word => {
        if (lowerSummary.includes(word)) {
            advancedCount++;
        }
    });

    // Check for beginner words
    let beginnerCount = 0;
    BEGINNER_WORDS.forEach(word => {
        if (lowerSummary.includes(word)) {
            beginnerCount++;
        }
    });

    if (beginnerCount > advancedCount && beginnerCount >= 1) {
        return 'beginner';
    } else if (advancedCount >= 2) {
        return 'intermediate-advanced';
    } else {
        return 'intermediate';
    }
}

/**
 * Splits a text into key points (sentences).
 * @param {string} summary The text summary.
 * @returns {string[]} An array of key point sentences.
 */
function extractKeyPoints(summary, maxPoints = 5) {
    if (!summary) return [];

    // Simple sentence splitting (handles common .!? followed by space and capital letter)
    const sentences = summary.match(/[^.!?]+[.!?]\s+/g) || [summary];

    // Clean up points and ensure they don't exceed the limit
    return sentences
        .map(s => s.trim())
        .filter(s => s.length > 20) // Filter out very short segments
        .slice(0, maxPoints);
}

class AnalysisAgent {
    /**
     * Executes the analysis task on the research result.
     * @param {object} researchResult Output from ResearchAgent.
     * @returns {object} The structured analysis result.
     */
    run(researchResult) {
        if (!researchResult.ok || !researchResult.summary) {
            console.warn(`[Analysis] No content to analyze. Skipping.`);
            return {
                hasContent: false,
                difficulty: 'unknown',
                keyPoints: [],
                advisory: 'No research content was found to analyze.'
            };
        }

        const summary = researchResult.summary;
        const keyPoints = extractKeyPoints(summary);
        let finalPoints = keyPoints;
        if (finalPoints.length === 0 && summary) {
            finalPoints = [summary]; // fallback: use full summary as one key point
        }
        const difficulty = inferDifficulty(summary);

        console.log(`[Analysis] Extracted ${finalPoints.length} key points. Difficulty: ${difficulty}`);

        return {
            hasContent: true,
            difficulty: difficulty,
            keyPoints: finalPoints,
            advisory: 'These points are based on an initial Wikipedia summary; always cross-check for critical or specific decisions.'
        };
    }
}

module.exports = AnalysisAgent;