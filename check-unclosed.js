const fs = require('fs');
const content = fs.readFileSync('app/assistant/page.tsx', 'utf8');
let inString = false;
let stringChar = '';
let inTemplate = false;
let inComment = false;
let line = 1;
let lastStringStart = 0;
let lastTemplateStart = 0;
for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '\n') {
        line++;
        continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
        if (!inString && !inComment) {
            inString = true;
            stringChar = ch;
            if (ch === '`') {
                inTemplate = true;
                lastTemplateStart = line;
            } else {
                lastStringStart = line;
            }
        } else if (inString && ch === stringChar && content[i-1] !== '\\') {
            if (inTemplate) inTemplate = false;
            inString = false;
            stringChar = '';
        } else if (inString && ch === '`') {
            inTemplate = !inTemplate;
        }
    } else if (ch === '/' && !inString && !inComment) {
        if (content[i+1] === '/' || content[i+1] === '*') {
            inComment = true;
        }
    } else if (inComment && ch === '\n') {
        inComment = false;
    } else if (inComment && ch === '*' && content[i+1] === '/') {
        inComment = false;
        i++;
    }
}
console.log('Final state:');
console.log('  inString:', inString);
console.log('  inTemplate:', inTemplate);
console.log('  inComment:', inComment);