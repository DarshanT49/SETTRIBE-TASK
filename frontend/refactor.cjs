const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(dirPath);
    });
}

walk(path.join(__dirname, 'src'), (filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        // Replace syncGet with await asyncGet
        if (content.includes('syncGet(')) {
            content = content.replace(/syncGet\(/g, 'await asyncGet(');
            changed = true;
        }
        
        // Add asyncGet to import if syncGet was replaced but asyncGet is not in import
        if (changed && content.includes('await asyncGet(') && !content.includes('asyncGet')) {
             content = content.replace(/import \{.*syncGet.*\} from/g, match => match.replace('syncGet', 'asyncGet, syncGet'));
        }

        if (changed) {
            fs.writeFileSync(filePath, content);
            console.log("Updated", filePath);
        }
    }
});
