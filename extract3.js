const fs = require('fs');
const lines = fs.readFileSync('/Users/azizekinci/.gemini/antigravity/brain/7c547be7-9507-4667-ae7a-c4de580ef5b4/.system_generated/logs/transcript_full.jsonl', 'utf8').split('\n');
const files = new Set();
for (const line of lines) {
  if (!line) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.content) {
      const content = obj.content;
      let match;
      const regex = /<file[^>]*name="([^"]+)"/g;
      while ((match = regex.exec(content)) !== null) {
        files.add(match[1]);
      }
      const regex2 = /<file[^>]*path="([^"]+)"/g;
      while ((match = regex2.exec(content)) !== null) {
        files.add(match[1]);
      }
    }
  } catch(e) {}
}
console.log("Attached files found:", Array.from(files).join(', '));
