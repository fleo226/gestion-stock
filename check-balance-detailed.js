const fs = require('fs');
const content = fs.readFileSync('app/assistant/page.tsx', 'utf8');
let braceDepth = 0;
let parenDepth = 0;
let bracketDepth = 0;
let inString = false;
let stringChar = '';
let inComment = false;
let line = 1;
for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '\n') { line++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') {
        if (!inString && !inComment) { inString = true; stringChar = ch; }
        else if (inString && ch === stringChar && content[i-1] !== '\\') { inString = false; stringChar = ''; }
    } else if (ch === '/' && !inComment) {
        if (content[i+1] === '/' || content[i+1] === '*') { inComment = true; }
    } else if (inComment && ch === '\n') { inComment = false; }
    else if (inComment && ch === '*' && content[i+1] === '/') { inComment = false; i++; }
    else if (!inString && !inComment) {
        if (ch === '{') { braceDepth++; console.log('Line ' + line + ': { braceDepth=' + braceDepth); }
        else if (ch === '}') { braceDepth--; console.log('Line ' + line + ': } braceDepth=' + braceDepth); }
        else if (ch === '(') { parenDepth++; console.log('Line ' + line + ': ( parenDepth=' + parenDepth); }
        else if (ch === ')') { parenDepth--; console.log('Line ' + line + ': ) parenDepth=' + parenDepth); }
        else if (ch === '[') bracketDepth++;
        else if (ch === ']') bracketDepth--;
    }
    if (ch === '\n') line++;
}
console.log('Final depths:');
console.log('  brace:', braceDepth);
console.log('  paren:', parenDepth);
console.log('  bracket:', bracketDepth);