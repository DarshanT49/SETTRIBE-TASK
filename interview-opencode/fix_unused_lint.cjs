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

    // Remove 'React' from import if unused
    if (content.includes("import React") && !content.includes("React.")) {
        content = content.replace(/import\s+React\s*,\s*\{/g, 'import {');
        content = content.replace(/import\s+React\s+from\s+['"]react['"];?/g, '');
        changed = true;
    }

    // Remove syncGet/syncSet from storage imports
    if (content.includes("syncGet") || content.includes("syncSet")) {
        content = content.replace(/syncGet\s*,?\s*/g, '');
        content = content.replace(/syncSet\s*,?\s*/g, '');
        // Cleanup trailing commas in imports
        content = content.replace(/,\s*\}/g, ' }');
        content = content.replace(/\{\s*,/g, '{ ');
        changed = true;
    }

    // Fix SelfTasks.jsx load() effect
    if (file.endsWith('SelfTasks.jsx')) {
        let newContent = content.replace(/const\s+load\s*=\s*async\s*\(\)\s*=>\s*\{([\s\S]*?)\};\s*useEffect\(\s*\(\)\s*=>\s*\{\s*load\(\);\s*\},\s*\[\]\s*\);/, 
            `useEffect(() => {
    (async () => {
      $1
    })();
  }, [currentUser.id]);`);
        if (newContent !== content) {
            content = newContent;
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log("Fixed unused in:", file);
    }
});
