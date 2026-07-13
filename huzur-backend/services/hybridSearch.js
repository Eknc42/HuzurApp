const Database = require("better-sqlite3");

const { createEmbedding } = require("./services/embedding");
const { search } = require("./services/qdrant");

const db = new Database("./knowledge/knowledge.db", {
    readonly: true,
});

/**
 * Hybrid Search
 *
 * 1. Semantic Search (Qdrant)
 * 2. Keyword Search (SQLite FTS5)
 * 3. Merge
 * 4. Remove duplicates
 */

async function hybridSearch(question) {

    //-----------------------------------
    // Embedding
    //-----------------------------------

    const vector = await createEmbedding(question);

    //-----------------------------------
    // Semantic Search
    //-----------------------------------

    const semanticResults = await search(vector, 10);

    //-----------------------------------
    // Keyword Search
    //-----------------------------------

    const keywordStmt = db.prepare(`
        SELECT
            id,
            title,
            content,
            type,
            citation,
            bm25(knowledge) AS score
        FROM knowledge
        WHERE knowledge MATCH ?
        ORDER BY score
        LIMIT 10
    `);

    const keywordResults = keywordStmt.all(question);

    //-----------------------------------
    // Normalize Semantic
    //-----------------------------------

    const semantic = semanticResults.map(item => ({
        id: item.payload.id,
        title: item.payload.title,
        content: item.payload.content,
        type: item.payload.type,
        citation:
            item.payload.citation?.display ??
            item.payload.title,
        semanticScore: item.score,
        keywordScore: null,
        source: "semantic"
    }));

    //-----------------------------------
    // Normalize Keyword
    //-----------------------------------

    const keyword = keywordResults.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        type: item.type,
        citation: item.citation,
        semanticScore: null,
        keywordScore: item.score,
        source: "keyword"
    }));

    //-----------------------------------
    // Merge
    //-----------------------------------

    const merged = new Map();

    for (const item of semantic) {
        merged.set(item.id, item);
    }

    for (const item of keyword) {

        if (merged.has(item.id)) {

            const existing = merged.get(item.id);

            existing.keywordScore = item.keywordScore;
            existing.source = "hybrid";

        } else {

            merged.set(item.id, item);

        }
    }

    //-----------------------------------
    // Ranking
    //-----------------------------------

    const results = [...merged.values()];

    results.sort((a, b) => {

        const sa = a.semanticScore ?? 0;
        const sb = b.semanticScore ?? 0;

        return sb - sa;

    });

    //-----------------------------------
    // Top Results
    //-----------------------------------

    return results.slice(0, 5);

}

module.exports = {
    hybridSearch,
};
