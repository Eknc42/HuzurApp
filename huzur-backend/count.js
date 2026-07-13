require("dotenv").config();

const { QdrantClient } = require("@qdrant/js-client-rest");

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

async function main() {
  const info = await client.getCollection("huzur");

  console.log(info.points_count);
}

main();
