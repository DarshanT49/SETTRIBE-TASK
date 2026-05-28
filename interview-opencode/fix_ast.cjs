const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

const srcDir = path.join(__dirname, 'src');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(dirPath);
    });
}

walk(srcDir, (filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        try {
            const ast = parser.parse(content, {
                sourceType: 'module',
                plugins: ['jsx', 'classProperties', 'exportDefaultFrom']
            });
            
            let changed = false;

            traverse(ast, {
                AwaitExpression(path) {
                    let parentFunc = path.getFunctionParent();
                    if (parentFunc && !parentFunc.node.async) {
                        parentFunc.node.async = true;
                        changed = true;
                    }
                }
            });

            if (changed) {
                const output = generate(ast, { retainLines: true, retainFunctionParens: true, jsescOption: { minimal: true } }, content);
                fs.writeFileSync(filePath, output.code);
                console.log("Fixed async in:", filePath);
            }
        } catch (e) {
            console.error("Failed to parse:", filePath, e.message);
        }
    }
});
