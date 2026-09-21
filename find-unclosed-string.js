const fs = require('fs');
const content = fs.readFileSync('app/assistant/page.tsx', 'utf8');
let inString = false;
let stringChar = '';
let inTemplate = false;
let inComment = false;
let line = 1;
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
                // template
            } else {
                // string
            }
        } else if (inString && ch === stringChar && content[i-1] !== '\\') {
            inString = false;
            stringChar = '';
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
if (inString) {
    console.log('UNCOLOSED STRING at end of file!');
    // Find start line
    let inString2 = false;
    let stringChar2 = '';
    let inComment2 = false;
    let line2 = 1;
    let startLine = 0;
    for (let i = 0; i < content.length; i++) {
        const ch = content[i];
        if (ch === '\n') line2++;
        if (ch === '"' || ch === "'" || ch === '`') {
            if (!inString2 && !inComment2) {
                inString2 = true;
                stringChar2 = ch;
                startLine = line2;
            } else if (inString2 && ch === stringChar2 && content[i-1] !== '\\') {
                inString2 = false;
                stringChar2 = '';
            }
        } else if (ch === '/' && !inString2 && !inComment2) {
            if (content[i+1] === '/' || content[i+1] === '*') {
                inComment2 = true;
            }
        } else if (inComment2 && ch === '\n') {
            inComment2 = false;
        } else if (inComment2 && ch === '*' && content[i+1] === '/') {
            inComment2 = false;
            i++;
        }
    }
    console.log('Unclosed string started at line:', startLine);
} else {
    console.log('No unclosed string found');
}