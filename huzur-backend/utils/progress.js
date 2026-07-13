const fs = require("fs");

const FILE = "./progress.json";

function loadProgress() {
  if (!fs.existsSync(FILE)) {
    return { lastIndex: 0 };
  }

  return JSON.parse(fs.readFileSync(FILE));
}

function saveProgress(lastIndex) {
  fs.writeFileSync(
    FILE,
    JSON.stringify({ lastIndex }, null, 2)
  );
}

module.exports = {
  loadProgress,
  saveProgress,
};
