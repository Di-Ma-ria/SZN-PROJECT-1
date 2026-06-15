const fs = require('fs');
const path = 'validation/authValidation.js';
let text = fs.readFileSync(path, 'utf8');
text = text.replace(/\.message\(/g, '.messages(');
text = text.replace(/any\.requested/g, 'any.required');
fs.writeFileSync(path, text, 'utf8');
console.log('updated', path);
