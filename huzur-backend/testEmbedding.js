const { createEmbedding } = require("./services/embedding");

async function main() {
  const vector = await createEmbedding("Allah birdir.");

  console.log("Boyut:", vector.length);
  console.log(vector.slice(0, 10));
}

main();
