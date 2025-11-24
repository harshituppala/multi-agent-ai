// src/agents/taskAgent.js

/**
 * Classifies the user's intent based on keywords.
 * @param {string} query The user's question.
 * @returns {'getting-started' | 'comparison' | 'overview' | 'no-content'} The determined mode.
 */
function classifyIntent(query, hasContent) {
    if (!hasContent) {
        return 'no-content';
    }

    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('how to') || lowerQuery.includes('how do i') ||
        lowerQuery.includes('get started') || lowerQuery.includes('for beginners') ||
        lowerQuery.includes('learn')) {
        return 'getting-started';
    }

    if (lowerQuery.includes('compare') || lowerQuery.includes(' vs ')) {
        return 'comparison';
    }

    return 'overview';
}

/**
 * Generates the Markdown-formatted answer based on the analysis.
 * @param {object} research The research result.
 * @param {object} analysis The analysis result.
 * @param {string} mode The presentation mode.
 * @returns {string} The final Markdown text.
 */
function generateAnswer(research, analysis, mode) {
    const { topic, url } = research;
    const { difficulty, keyPoints, advisory } = analysis;
    const difficultyText = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

    let answer = `## 📚 ${topic}\n\n`;

    if (mode === 'getting-started') {
        answer += `**Presentation Mode: GETTING STARTED**\n\n`;
        answer += `Welcome! The topic of **${topic}** has been identified with a complexity level of: **${difficultyText}**.\n\n`;
        answer += `To start your learning journey, focus on the fundamentals outlined below:\n\n`;

        keyPoints.forEach(point => {
            answer += `- **${point}**\n`;
        });

        answer += '\n---\n\n';
        answer += '### 💡 Suggested Next Steps\n';
        answer += '* **Read the Official Docs:** Start with the main documentation page linked below.\n';
        answer += '* **Try a Simple Tutorial:** Search for a "Hello World" or equivalent first project.\n';
        answer += '* **Understand Core Concepts:** Ensure you grasp the basic principles (e.g., if it\'s a tech topic, what is its primary problem domain?).\n\n';

    } else if (mode === 'comparison') {
        answer += `**Presentation Mode: COMPARISON**\n\n`;
        answer += `Here is an **Overview** of **${topic}** to help you start your comparison (Difficulty: **${difficultyText}**):\n\n`;

        keyPoints.forEach(point => {
            answer += `* ${point}\n`;
        });

        answer += '\n---\n\n';
        answer += `For a detailed comparison, you'll need to research its key alternatives and competitors. The points above provide its core foundation.\n\n`;

    } else { // 'overview' mode
        answer += `**Presentation Mode: OVERVIEW**\n\n`;
        answer += `Here's a high-level overview of **${topic}** (Difficulty: **${difficultyText}**):\n\n`;

        keyPoints.forEach(point => {
            answer += `* ${point}\n`;
        });
    }

    // Final Footer
    answer += '\n---\n';
    answer += `**Source URL:** [Wikipedia: ${topic}](${url})\n`;
    answer += `**Advisory:** *${advisory}*\n`;

    return answer;
}

class TaskAgent {
    /**
     * Executes the task planning and final answer generation.
     * @param {string} query The user's original question.
     * @param {object} researchResult The research agent's output.
     * @param {object} analysisResult The analysis agent's output.
     * @returns {object} The structured task result.
     */
    run(query, researchResult, analysisResult) {
        const mode = classifyIntent(query, analysisResult.hasContent);

        let finalAnswer;
        if (mode === 'no-content') {
            const topicsTried = Array.isArray(researchResult.triedTopics) && researchResult.triedTopics.length > 0
                ? researchResult.triedTopics.join(', ')
                : (researchResult.topic ? researchResult.topic : 'No candidate topics were generated');

            const reason = researchResult.errorSummary || researchResult.error || 'No suitable Wikipedia article was found for this query.';

            finalAnswer = [
                '## ❌ No Content Found',
                '',
                'The agent pipeline could not build an answer from Wikipedia for your question.',
                '',
                `Query: ${query}`,
                `Topics tried: ${topicsTried}`,
                `Reason: ${reason}`,
                '',
                'Suggestions:',
                '- Try using a broader or simpler topic (remove prices, dates, or very local details).',
                '- Check spelling for names or technical terms.',
                '- If your question is about a very specific product or version, try asking about the general concept instead.'
            ].join('\n');

            console.log('[Task] Mode: no-content. Returning detailed failure message.');
        } else {
            finalAnswer = generateAnswer(researchResult, analysisResult, mode);
            console.log(`[Task] Classified intent: ${mode}. Final answer generated.`);
        }

        return {
            mode: mode,
            finalAnswer: finalAnswer
        };
    }
}

module.exports = TaskAgent;