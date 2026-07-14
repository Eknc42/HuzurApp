const { askGemini } = require("./services/gemini");

async function main() {

    const context = `
Kur'an
Bakara 43

Namazı dosdoğru kılın.
Zekâtı verin.
`;

    const answer = await askGemini(
        "Kripto para caiz mi?",
        "",
        "general"
    );

    console.log(answer);
}

main();
