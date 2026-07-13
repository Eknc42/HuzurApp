const { searchKeyword } = require("./services/sqliteSearch");

const results = searchKeyword("oruç", 5);

console.log(results);
