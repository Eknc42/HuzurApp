const Database = require("better-sqlite3");

const db = new Database("./knowledge.db");

module.exports = db;
