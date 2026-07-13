const { Ollama } = require("ollama");

const ollama = new Ollama({
  host: "http://127.0.0.1:11434",
});

const MODEL = "jeffh/intfloat-multilingual-e5-large:q8_0";

async function createEmbedding(text, type = "query") {
  try {
    const prefix = type === "query" ? "query: " : "passage: ";

    const response = await ollama.embed({
      model: MODEL,
      input: prefix + text,
    });

    return response.embeddings[0];
  } catch (err) {
    console.error("Embedding Error:", err.message);
    throw err;
  }
}

module.exports = {
  createEmbedding,
  MODEL,
};
