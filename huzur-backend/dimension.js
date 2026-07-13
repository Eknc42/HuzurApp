const { Ollama } = require("ollama");

const ollama = new Ollama({
  host: "http://127.0.0.1:11434",
});

async function main() {
  const response = await ollama.embed({
    model: "nomic-embed-text",
    input: "Allah birdir.",
  });

  console.log("Dimension:", response.embeddings[0].length);
}

main().catch(console.error);
