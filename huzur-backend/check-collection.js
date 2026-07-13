// check-collection.js
require("dotenv").config();
const { client } = require("./services/qdrant");

(async () => {
  try {
    const info = await client.getCollection("huzur");
    console.log("Points count:", info.points_count);
    console.log("Vector config:", info.config.params.vectors);
  } catch (err) {
    console.error("HATA:", err.message);
  }
})();
