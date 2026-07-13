require("dotenv").config();

const { QdrantClient } = require("@qdrant/js-client-rest");

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

async function upsertPoints(points) {
  await client.upsert("huzur", {
    wait: true,
    points,
  });
}

async function search(vector, limit = 5) {
  return await client.search("huzur", {
    vector,
    limit,
    with_payload: true,
  });
}

module.exports = {
  client,
  upsertPoints,
  search,
};
