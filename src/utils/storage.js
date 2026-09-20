const path = require('node:path');
const fs = require('node:fs');
const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });
module.exports = { dataDir };
