const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../client/src/pages/shigma/HistorialTrazabilidad.jsx');
const content = fs.readFileSync(filePath, 'utf8');

let curlyStack = [];
let parenStack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '{') {
            curlyStack.push({ line: i + 1, char: j + 1 });
        }
        if (char === '}') {
            if (curlyStack.length === 0) {
                console.log(`Unmatched } at line ${i + 1}:${j + 1}`);
            } else {
                curlyStack.pop();
            }
        }
        if (char === '(') {
            parenStack.push({ line: i + 1, char: j + 1 });
        }
        if (char === ')') {
            if (parenStack.length === 0) {
                console.log(`Unmatched ) at line ${i + 1}:${j + 1}`);
            } else {
                parenStack.pop();
            }
        }
    }
}

if (curlyStack.length > 0) {
    console.log('Unclosed { at lines:', curlyStack);
}
if (parenStack.length > 0) {
    console.log('Unclosed ( at lines:', parenStack);
}
