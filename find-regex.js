const fs = require('fs');
const content = fs.readFileSync('app/assistant/page.tsx', 'utf8');
let inString = false;
let stringChar = '';
let inTemplate = false;
let inComment = false;
let line = 1;
for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '\n') line++;
    if (ch === '"' || ch === "'" || ch === '`') {
        if (!inString && !inComment) {
            inString = true;
            stringChar = ch;
        } else if (inString && ch === stringChar && content[i-1] !== '\\') {
            inString = false;
            inTemplate = false;
            stringChar = '';
        } else if (inString && ch === '`') {
            inTemplate = !inTemplate;
        }
    } else if (ch === '/' && !inString && !inComment) {
        if (content[i+1] === '/' || content[i+1] === '*') {
            inComment = true;
        } else if (!inTemplate && !inComment) {
            console.log('Potential regex at line ' + line + ', pos ' + i + ': ' + content.substring(i, Math.min(i+50, content.length)).replace(/\n/g, '\\n'));
        }
    } else if (inComment && ch === '\n') {
        inComment = false;
    } else if (inComment && ch === '*' && content[i+1] === '/') {
        inComment = false;
        i++;
    }
}