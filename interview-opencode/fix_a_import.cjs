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

    // Remove 'a' from imports
    let newContent = content.replace(/,\s*a\s*}/g, ' }');
    newContent = newContent.replace(/\{\s*a\s*,/g, '{ ');
    newContent = newContent.replace(/,\s*a\s*,/g, ', ');
    
    if (newContent !== content) {
        fs.writeFileSync(file, newContent);
        console.log("Fixed import in:", file);
    }
});
