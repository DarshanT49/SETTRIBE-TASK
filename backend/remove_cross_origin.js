const fs = require('fs');
const path = require('path');
const dir = 'd:/Meeting and Task/SETTRIBE-TASK/backend/src/main/java/com/settribe/controller';

fs.readdirSync(dir).forEach(f => {
    if (f.endsWith('.java')) {
        const p = path.join(dir, f);
        let c = fs.readFileSync(p, 'utf8');
        c = c.replace(/@CrossOrigin\(origins\s*=\s*"[^"]*"\)(\s*\/\/[^\n]*)?\n/g, '');
        fs.writeFileSync(p, c);
        console.log(`Processed ${f}`);
    }
});
