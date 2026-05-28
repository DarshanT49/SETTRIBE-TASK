const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/main/java/com/settribe/entity');
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('.java')) {
        let content = fs.readFileSync(path.join(dir, file), 'utf8');

        // Remove lombok imports
        content = content.replace(/import lombok\..*;\n/g, '');
        // Remove lombok annotations
        content = content.replace(/@Data\n/g, '');
        content = content.replace(/@NoArgsConstructor\n/g, '');
        content = content.replace(/@AllArgsConstructor\n/g, '');

        // Extract fields
        const fieldRegex = /private\s+([A-Za-z0-9<>_]+)\s+([a-zA-Z0-9_]+);/g;
        let match;
        const fields = [];
        while ((match = fieldRegex.exec(content)) !== null) {
            fields.push({ type: match[1], name: match[2] });
        }

        const classNameMatch = content.match(/public class ([a-zA-Z0-9_]+)/);
        if (!classNameMatch) return;
        const className = classNameMatch[1];

        // Generate constructors
        let noArgConstructor = `\n    public ${className}() {\n    }\n`;
        
        let allArgArgs = fields.map(f => `${f.type} ${f.name}`).join(', ');
        let allArgAssign = fields.map(f => `        this.${f.name} = ${f.name};`).join('\n');
        let allArgConstructor = `\n    public ${className}(${allArgArgs}) {\n${allArgAssign}\n    }\n`;

        // Generate getters and setters
        let gettersAndSetters = '';
        fields.forEach(f => {
            const capitalized = f.name.charAt(0).toUpperCase() + f.name.slice(1);
            gettersAndSetters += `\n    public ${f.type} get${capitalized}() {\n        return ${f.name};\n    }\n`;
            gettersAndSetters += `\n    public void set${capitalized}(${f.type} ${f.name}) {\n        this.${f.name} = ${f.name};\n    }\n`;
        });

        // Insert before the last closing brace
        const lastBraceIndex = content.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
            const newContent = content.substring(0, lastBraceIndex) +
                               noArgConstructor + 
                               allArgConstructor + 
                               gettersAndSetters + 
                               content.substring(lastBraceIndex);
            fs.writeFileSync(path.join(dir, file), newContent);
            console.log(`Processed ${file}`);
        }
    }
});
