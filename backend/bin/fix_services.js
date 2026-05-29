const fs = require('fs');
const path = require('path');

const serviceDir = path.join(__dirname, 'src/main/java/com/settribe/service');
const files = fs.readdirSync(serviceDir).filter(f => f.endsWith('Service.java'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(serviceDir, file), 'utf8');
    
    // Using Regex to match the block accurately
    // We are looking for:
    // public ClassDTO update(String id, ClassDTO dto) {
    //     if(repository.existsById(id)) {
    //         // assume entity has id set, or we could set it
    //         return repository.save(entity);
    //     }
    //     throw new RuntimeException("Entity not found");
    // }

    const className = file.replace('Service.java', '');

    const regex = new RegExp(`if\\s*\\(repository\\.existsById\\(id\\)\\)\\s*\\{[\\s\\S]*?return\\s*repository\\.save\\(entity\\);\\s*\\}`, 'm');
    
    if (regex.test(content)) {
        const replacement = `if(repository.existsById(id)) {
            ${className} entity = com.settribe.mapper.${className}Mapper.toEntity(dto);
            entity.setId(id);
            return com.settribe.mapper.${className}Mapper.toDTO(repository.save(entity));
        }`;
        
        content = content.replace(regex, replacement);
        fs.writeFileSync(path.join(serviceDir, file), content);
        console.log(`Fixed ${file}`);
    }
});
