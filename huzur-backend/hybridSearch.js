const Database = require("better-sqlite3");

const { createEmbedding } = require("./services/embedding");
const { search } = require("./services/qdrant");

const db = new Database("./knowledge/knowledge.db", {
    readonly: true,
});

async function hybridSearch(question) {

    const vector = await createEmbedding(question, "query");

    const semanticResults = await search(vector, 10);

    const keywordStmt = db.prepare(`
        SELECT
            id,
            title,
            content,
            type,
            source,
            bm25(documents) AS score
        FROM documents
        WHERE documents MATCH ?
        ORDER BY score
        LIMIT 10
    `);

    const terms = question
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter(Boolean);

    const matchQuery = terms.join(" OR ");

    const keywordResults = matchQuery
        ? keywordStmt.all(matchQuery)
        : [];

    const semantic = semanticResults.map(item => ({
        id: item.payload.id,
        title: item.payload.title,
        content: item.payload.content,
        type: item.payload.type,
        citation: item.payload.citation?.display ?? item.payload.title,
        semanticScore: item.score,
        keywordScore: null,
        source: "semantic"
    }));

    const keyword = keywordResults.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        type: item.type,
        citation: item.source,
        semanticScore: null,
        keywordScore: item.score,
        source: "keyword"
    }));

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

    const results = [...merged.values()];

    // bm25 skoru negatiftir, 0'a yakin = daha iyi eslesme.
    // semantic skorla (0-1 cosine) karsilastirilabilir hale getiriyoruz.
    results.forEach(item => {
        const semanticNorm = item.semanticScore ?? 0;
        const keywordNorm = item.keywordScore != null
            ? Math.max(0, Math.min(1, (15 + item.keywordScore) / 15))
            : 0;

        item.finalScore = (semanticNorm * 0.7) + (keywordNorm * 0.3);
    });

    results.sort((a, b) => b.finalScore - a.finalScore);

    const bestScore = results.length > 0
        ? Math.max(...results.map(r => r.semanticScore ?? 0))
        : 0;

    return {
        results: results.slice(0, 5),
        bestScore,
    };

}

module.exports = {
    hybridSearch,
};
