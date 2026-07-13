require("dotenv").config();
const { QdrantClient } = require("@qdrant/js-client-rest");

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

async function run() {
  try {
    await client.deleteCollection("huzur");
    console.log("Eski 'huzur' collection silindi.");
  } catch (err) {
    console.log("Not:", err.message);
  }

  await client.createCollection("huzur", {
    vectors: {
      size: 1024,
      distance: "Cosine",
    },
  });

  console.log("Yeni 'huzur' collection 1024 boyutla olusturuldu.");
}

run();
