require("dotenv").config();

const { QdrantClient } = require("@qdrant/js-client-rest");

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

async function createCollection() {
  try {
    await client.createCollection("huzur", {
      vectors: {
        size: 768,
        distance: "Cosine",
      },
    });

    console.log("✅ 'huzur' collection oluşturuldu.");
  } catch (err) {
    if (err.message?.includes("already exists")) {
      console.log("ℹ️ Collection zaten mevcut.");
    } else {
      console.error(err);
    }
  }
}

createCollection();
