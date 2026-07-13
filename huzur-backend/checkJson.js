const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("./knowledge/knowledge_base_final.json", "utf8")
);

console.log("JSON başarıyla okundu.");

console.log("Üst seviye anahtarlar:");

console.log(Object.keys(data));
