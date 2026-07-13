const fs = require('fs');
const lines = fs.readFileSync('/Users/azizekinci/.gemini/antigravity/brain/7c547be7-9507-4667-ae7a-c4de580ef5b4/.system_generated/logs/transcript_full.jsonl', 'utf8').split('\n');

for (const line of lines) {
  if (!line) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.content) {
      const content = obj.content;
      if (content.includes('QuranScreen.js')) {
        const matches = content.match(/<file path="([^"]+)">(.*?)<\/file>/gs);
        if (matches) {
          for (const match of matches) {
             const pathMatch = match.match(/path="([^"]+)"/);
             if (pathMatch) {
               console.log('Found file attached in transcript:', pathMatch[1]);
               // save it!
               const codeMatch = match.match(/<file path="[^"]+">(.*?)<\/file>/s);
               if (codeMatch) {
                 fs.writeFileSync(pathMatch[1], codeMatch[1].trim());
                 console.log('Restored', pathMatch[1]);
               }
             }
          }
        }
      }
    }
  } catch(e) {}
}
