const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/ui/Modal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('"use client"')) {
  content = '"use client";\n' + content;
  fs.writeFileSync(filePath, content, 'utf8');
}
