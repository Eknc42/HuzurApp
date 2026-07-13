const { Ollama } = require("ollama");
const ollama = new Ollama({ host: "http://127.0.0.1:11434" });

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function embed(model, prefix, text) {
  const r = await ollama.embed({ model, input: prefix + text });
  return r.embeddings[0];
}

async function main() {
  const query = "islamın şartı kaçtır";

  // Gerçekte veri setinizde olan, ilgili bir hadis metni (örnek - siz gerçek bir tanesini yapıştırın)
  const relevantDoc = "İslam beş esas üzerine kurulmuştur: Allah'tan başka ilah olmadığına ve Muhammed'in Allah'ın Resulü olduğuna şahitlik etmek, namaz kılmak, zekat vermek, hac yapmak, ramazan orucu tutmak.";

  // Alakasız bir metin (örnek)
  const irrelevantDoc = "Koltuk altlarının tıraş edilmesi sünnettir, sağ taraftan başlamak müstehaptır.";

  console.log("=== nomic-embed-text ===");
  const nq = await embed("nomic-embed-text", "search_query: ", query);
  const nr = await embed("nomic-embed-text", "search_document: ", relevantDoc);
  const ni = await embed("nomic-embed-text", "search_document: ", irrelevantDoc);
  console.log("İlgili   :", cosineSim(nq, nr).toFixed(4));
  console.log("İlgisiz  :", cosineSim(nq, ni).toFixed(4));

  console.log("\n=== multilingual-e5-large ===");
  const eq = await embed("jeffh/intfloat-multilingual-e5-large:q8_0", "query: ", query);
  const er = await embed("jeffh/intfloat-multilingual-e5-large:q8_0", "passage: ", relevantDoc);
  const ei = await embed("jeffh/intfloat-multilingual-e5-large:q8_0", "passage: ", irrelevantDoc);
  console.log("İlgili   :", cosineSim(eq, er).toFixed(4));
  console.log("İlgisiz  :", cosineSim(eq, ei).toFixed(4));
}

main().catch(console.error);
