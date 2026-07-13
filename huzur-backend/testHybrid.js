const { hybridSearch } = require("./services/hybridSearch");

(async () => {

    const result = await hybridSearch("oruç");

    console.log("VECTOR");
    console.log(result.vectorResults.length);

    console.log("KEYWORD");
    console.log(result.keywordResults.length);

})();
