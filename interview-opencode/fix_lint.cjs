const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walk(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

walk(path.join(__dirname, 'src'), (file) => {
    if (!file.endsWith('.js') && !file.endsWith('.jsx')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // 1. Fix missing imports
    if (content.includes('import { syncGet') || content.includes('import { KEYS')) {
        let newContent = content.replace(/import\s*\{([^}]*)\}\s*from\s*(['"])(.*?storage)(['"])/g, (match, imports, q1, pathStr, q2) => {
            let parts = imports.split(',').map(s => s.trim());
            if (content.includes('asyncGet') && !parts.includes('asyncGet')) parts.push('asyncGet');
            if (content.includes('asyncSet') && !parts.includes('asyncSet')) parts.push('asyncSet');
            if (content.includes('asyncUpdate') && !parts.includes('asyncUpdate')) parts.push('asyncUpdate');
            if (content.includes('asyncDelete') && !parts.includes('asyncDelete')) parts.push('asyncDelete');
            
            // Reconstruct the import statement cleanly
            return `import { ${parts.filter(Boolean).join(', ')} } from ${q1}${pathStr}${q2}`;
        });
        if (newContent !== content) { content = newContent; changed = true; }
    }

    // 2. Remove async from React components
    // `export default async function` -> `export default function`
    if (content.includes('export default async function')) {
        content = content.replace(/export default async function/g, 'export default function');
        changed = true;
    }
    
    // Also `const Component = async () => {` if it contains `return (` inside a top-level. This might be tricky, but mostly components use `export default function`.

    // 3. Fix useEffectasync (() => {
    if (content.includes('useEffectasync')) {
        content = content.replace(/useEffectasync\s*\(\(\)\s*=>/g, 'useEffect(async () =>');
        changed = true;
    }

    // 4. Fix useEffect(async () => { ... }, [...]) to useEffect(() => { (async () => { ... })(); }, [...])
    let newContent2 = content.replace(/useEffect\(\s*async\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*(\[[^\]]*\]|\w+)?\s*\)/g, (match, body, deps) => {
        return `useEffect(() => {\n    (async () => {${body}})();\n  }, ${deps || '[]'})`;
    });
    if (newContent2 !== content) { content = newContent2; changed = true; }

    // 5. Fix `asyncGet` not being imported if it was not in a standard import block.
    // If it's still missing, we could add it, but our step 1 handles existing storage imports.
    if (content.includes('asyncGet') && !content.includes('import') && !content.includes('require')) {
        // Assuming it needs it (rarely happens)
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log("Fixed Lint in:", file);
    }
});
