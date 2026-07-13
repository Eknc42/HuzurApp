const readline = require("readline");

const { hybridSearch } = require("./hybridSearch");
const { askGemini } = require("./services/gemini");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Sorunuz: ", async (question) => {
  try {
    console.log("\nHybrid Search çalışıyor...\n");

    const { results, bestScore } = await hybridSearch(question);

    console.log(`✓ ${results.length} sonuç bulundu.\n`);
    console.log("Best Score:", bestScore);

    //------------------------------------
    // MODE SEÇ
    //------------------------------------

      let mode = results.length > 0 ? "mixed" : "general";
    console.log("Mode:", mode);

    //------------------------------------
    // CONTEXT
    //------------------------------------

    let context = "";

    console.log("========================================");
    console.log("HYBRID SEARCH SONUÇLARI");
    console.log("========================================\n");

    results.forEach((item, index) => {
      console.log(`#${index + 1}`);

      if (item.semanticScore != null)
        console.log("Semantic :", item.semanticScore);

      if (item.keywordScore != null)
        console.log("Keyword  :", item.keywordScore);

      console.log("Kaynak   :", item.source);
      console.log("Tür      :", item.type);
      console.log("Başlık   :", item.title);

      if (item.citation)
        console.log("Referans :", item.citation);

      console.log("\nİçerik (ilk 400 karakter):\n");

      console.log((item.content || "").substring(0, 400));

      console.log("\n----------------------------------------\n");

      context += `
Kaynak:
${item.citation || item.title}

${item.content}

----------------------------------------
`;
    });

    //------------------------------------
    // GENERAL modunda context gönderme
    //------------------------------------

    if (mode === "general") {
      context = "";
    }

    console.log("========================================");
    console.log("GEMINI'YE GÖNDERİLEN CONTEXT");
    console.log("========================================\n");

    console.log(context.substring(0, 3000));

    console.log("\n========================================");
    console.log("GEMINI CEVABI");
    console.log("========================================\n");

    const answer = await askGemini(
      question,
      context,
      mode
    );

    console.log(answer);

  } catch (err) {
    console.error("\nHATA:");
    console.error(err);
  } finally {
    rl.close();
  }
});
