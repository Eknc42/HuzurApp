const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("./knowledge/knowledge_base_final.json", "utf8")
);

console.log(JSON.stringify(data.points[0], null, 2));
