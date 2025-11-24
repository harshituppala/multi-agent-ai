// src/agents/coordinator.js
const ResearchAgent = require('./researchAgent');
const AnalysisAgent = require('./analysisAgent');
const TaskAgent = require('./taskAgent');

class CoordinatorAgent {
    constructor() {
        this.researchAgent = new ResearchAgent();
        this.analysisAgent = new AnalysisAgent();
        this.taskAgent = new TaskAgent();
    }

    async orchestrate(query) {
        console.log('[Coordinator] Starting orchestration...');

        let researchResult;
        try {
            researchResult = await this.researchAgent.run(query);
        } catch (err) {
            console.error('[Coordinator] Research agent error:', err.message);
            return {
                error: true,
                errorMessage: 'Research step failed unexpectedly.',
                research: null,
                analysis: null,
                task: { mode: 'no-content' },
                finalAnswer: `No Content Found\n\nThe research agent encountered an unexpected error while processing your query: "${query}".`
            };
        }

        let analysisResult;
        try {
            analysisResult = this.analysisAgent.run(researchResult);
        } catch (err) {
            console.error('[Coordinator] Analysis agent error:', err.message);
            analysisResult = {
                hasContent: false,
                difficulty: 'unknown',
                keyPoints: [],
                advisory: 'Analysis failed unexpectedly.'
            };
        }

        let taskResult;
        try {
            taskResult = this.taskAgent.run(query, researchResult, analysisResult);
        } catch (err) {
            console.error('[Coordinator] Task agent error:', err.message);
            return {
                error: true,
                errorMessage: 'Task planning failed unexpectedly.',
                research: researchResult,
                analysis: analysisResult,
                task: { mode: 'no-content' },
                finalAnswer: `An internal error prevented generating a final answer for the query: "${query}".`
            };
        }

        return {
            query: query,
            timestamp: new Date().toISOString(),
            research: researchResult,
            analysis: analysisResult,
            task: { mode: taskResult.mode },
            finalAnswer: taskResult.finalAnswer
        };
    }
}

module.exports = CoordinatorAgent;