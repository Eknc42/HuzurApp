const db = require("./sqlite");

function searchKeyword(query, limit = 10) {

    const stmt = db.prepare(`
        SELECT
            rowid,
            id,
            title,
            content,
            keywords,
            type,
            source,
            rank
        FROM documents
        WHERE documents MATCH ?
        ORDER BY rank
        LIMIT ?
    `);

    return stmt.all(query, limit);
}

module.exports = {
    searchKeyword,
};
