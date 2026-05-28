const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) walk(dirPath, callback);
        else callback(dirPath);
    });
}

walk(path.join(__dirname, 'src'), (file) => {
    if (!file.endsWith('.js') && !file.endsWith('.jsx')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // 1. Fix `await a(` to `await asyncGet(`
    let newContent = content.replace(/await\s+a\(/g, 'await asyncGet(');
    if (newContent !== content) { content = newContent; changed = true; }

    // 2. Fix `a(` which wasn't awaited? In some places it might just be `a(`.
    // Wait, did `asyncGet` ever appear without `await`? Yes, maybe `return a(...)`.
    // Let's do ` a(` -> ` asyncGet(`
    newContent = content.replace(/(\s|^|\=|\(|\[|\{)a\(/g, (m, p1) => `${p1}asyncGet(`);
    // Be careful, this replaces ` a(` but wait, if it was `(KEYS.SOMETHING, data)` how to restore `asyncSet`?
    // It was `syncSet(KEYS.SOMETHING, data)`, which became `(KEYS.SOMETHING, data)` because I replaced `syncSet` with `''`.
    // So we look for `(KEYS.` that is meant to be a function call.
    newContent = newContent.replace(/(\s|^|\}|;)\(KEYS\./g, (m, p1) => {
        return `${p1}asyncSet(KEYS.`;
    });

    if (newContent !== content) {
        fs.writeFileSync(file, newContent);
        console.log("Restored in:", file);
    }
});
