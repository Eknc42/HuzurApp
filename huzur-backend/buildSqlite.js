const fs = require("fs");
const Database = require("better-sqlite3");

const db = new Database("./knowledge.db");

// Eski tablo varsa sil
db.exec(`
DROP TABLE IF EXISTS documents;

CREATE VIRTUAL TABLE documents USING fts5(
    id,
    title,
    content,
    keywords,
    type,
    source
);
`);

console.log("✓ SQLite veritabanı oluşturuldu.");

// JSON'u oku
const json = JSON.parse(
    fs.readFileSync("./knowledge/knowledge_base_final.json", "utf8")
);

const points = json.points;

console.log(`Toplam ${points.length} kayıt bulundu.`);

// Insert sorgusu
const insert = db.prepare(`
INSERT INTO documents
(id,title,content,keywords,type,source)
VALUES (?,?,?,?,?,?)
`);

const insertMany = db.transaction((items) => {
    for (const item of items) {

        const payload = item.payload;

        insert.run(
            payload.id || "",
            payload.title || "",
            payload.content || "",
            (payload.keywords || []).join(" "),
            payload.type || "",
            payload.source?.name || ""
        );
    }
});

insertMany(points);

console.log(`✓ ${points.length} kayıt SQLite'a aktarıldı.`);
console.log("İşlem tamamlandı.");
