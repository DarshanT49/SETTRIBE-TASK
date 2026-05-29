const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src/main/java/com/settribe');
const entityDir = path.join(baseDir, 'entity');
const dtoDir = path.join(baseDir, 'dto');
const mapperDir = path.join(baseDir, 'mapper');
const serviceDir = path.join(baseDir, 'service');
const controllerDir = path.join(baseDir, 'controller');

// Ensure dirs
[dtoDir, mapperDir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const entities = fs.readdirSync(entityDir).filter(f => f.endsWith('.java'));

entities.forEach(file => {
    const entityContent = fs.readFileSync(path.join(entityDir, file), 'utf8');
    const classNameMatch = entityContent.match(/public class ([a-zA-Z0-9_]+)/);
    if (!classNameMatch) return;
    const className = classNameMatch[1];
    
    // Extract fields
    const fieldRegex = /private\s+([A-Za-z0-9<>_]+)\s+([a-zA-Z0-9_]+);/g;
    let match;
    const fields = [];
    while ((match = fieldRegex.exec(entityContent)) !== null) {
        fields.push({ type: match[1], name: match[2] });
    }
    
    // 1. Generate DTO
    let dtoCode = `package com.settribe.dto;\n\npublic class ${className}DTO {\n`;
    fields.forEach(f => {
        dtoCode += `    private ${f.type} ${f.name};\n`;
    });
    
    dtoCode += `\n    public ${className}DTO() {}\n`;
    
    const allArgs = fields.map(f => `${f.type} ${f.name}`).join(', ');
    const assigns = fields.map(f => `        this.${f.name} = ${f.name};`).join('\n');
    dtoCode += `\n    public ${className}DTO(${allArgs}) {\n${assigns}\n    }\n`;
    
    fields.forEach(f => {
        const capitalized = f.name.charAt(0).toUpperCase() + f.name.slice(1);
        dtoCode += `\n    public ${f.type} get${capitalized}() {\n        return ${f.name};\n    }\n`;
        dtoCode += `\n    public void set${capitalized}(${f.type} ${f.name}) {\n        this.${f.name} = ${f.name};\n    }\n`;
    });
    dtoCode += `}\n`;
    fs.writeFileSync(path.join(dtoDir, `${className}DTO.java`), dtoCode);
    
    // 2. Generate Mapper
    let mapperCode = `package com.settribe.mapper;\n\nimport com.settribe.entity.${className};\nimport com.settribe.dto.${className}DTO;\n\npublic class ${className}Mapper {\n`;
    
    // toDTO
    mapperCode += `    public static ${className}DTO toDTO(${className} entity) {\n`;
    mapperCode += `        if (entity == null) return null;\n`;
    mapperCode += `        ${className}DTO dto = new ${className}DTO();\n`;
    fields.forEach(f => {
        const cap = f.name.charAt(0).toUpperCase() + f.name.slice(1);
        mapperCode += `        dto.set${cap}(entity.get${cap}());\n`;
    });
    mapperCode += `        return dto;\n    }\n\n`;
    
    // toEntity
    mapperCode += `    public static ${className} toEntity(${className}DTO dto) {\n`;
    mapperCode += `        if (dto == null) return null;\n`;
    mapperCode += `        ${className} entity = new ${className}();\n`;
    fields.forEach(f => {
        const cap = f.name.charAt(0).toUpperCase() + f.name.slice(1);
        mapperCode += `        entity.set${cap}(dto.get${cap}());\n`;
    });
    mapperCode += `        return entity;\n    }\n`;
    mapperCode += `}\n`;
    fs.writeFileSync(path.join(mapperDir, `${className}Mapper.java`), mapperCode);
    
    // 3. Update Service
    const serviceFile = path.join(serviceDir, `${className}Service.java`);
    if (fs.existsSync(serviceFile)) {
        let sc = fs.readFileSync(serviceFile, 'utf8');
        sc = sc.replace(/import java\.util\.List;/g, `import java.util.List;\nimport java.util.stream.Collectors;\nimport com.settribe.dto.${className}DTO;\nimport com.settribe.mapper.${className}Mapper;`);
        
        // Replace return types and arguments
        sc = sc.replace(`public List<${className}> findAll() {`, `public List<${className}DTO> findAll() {`);
        sc = sc.replace(`return repository.findAll();`, `return repository.findAll().stream().map(${className}Mapper::toDTO).collect(Collectors.toList());`);
        
        sc = sc.replace(`public Optional<${className}> findById(String id) {`, `public Optional<${className}DTO> findById(String id) {`);
        sc = sc.replace(`return repository.findById(id);`, `return repository.findById(id).map(${className}Mapper::toDTO);`);
        
        sc = sc.replace(`public ${className} save(${className} entity) {`, `public ${className}DTO save(${className}DTO dto) {`);
        sc = sc.replace(`return repository.save(entity);`, `${className} entity = ${className}Mapper.toEntity(dto);\n        return ${className}Mapper.toDTO(repository.save(entity));`);
        
        sc = sc.replace(`public ${className} update(String id, ${className} entity) {`, `public ${className}DTO update(String id, ${className}DTO dto) {`);
        sc = sc.replace(`if(repository.existsById(id)) { return repository.save(entity); }`, 
            `if(repository.existsById(id)) {\n            ${className} entity = ${className}Mapper.toEntity(dto);\n            entity.setId(id);\n            return ${className}Mapper.toDTO(repository.save(entity));\n        }`);
        
        if (className === 'User') {
            sc = sc.replace(`public User findByEmail(String email) { return repository.findByEmail(email); }`, 
                `public UserDTO findByEmail(String email) { User u = repository.findByEmail(email); return u != null ? UserMapper.toDTO(u) : null; }`);
            sc = sc.replace(/public User findByEmail/g, `public UserDTO findByEmail`);
        }
        
        fs.writeFileSync(serviceFile, sc);
    }
    
    // 4. Update Controller
    const controllerFile = path.join(controllerDir, `${className}Controller.java`);
    if (fs.existsSync(controllerFile)) {
        let cc = fs.readFileSync(controllerFile, 'utf8');
        cc = cc.replace(/import java\.util\.List;/g, `import java.util.List;\nimport com.settribe.dto.${className}DTO;`);
        
        cc = cc.replace(new RegExp(`public List<${className}> getAll\\(\\)`, 'g'), `public List<${className}DTO> getAll()`);
        cc = cc.replace(new RegExp(`ResponseEntity<${className}> getById`, 'g'), `ResponseEntity<${className}DTO> getById`);
        cc = cc.replace(new RegExp(`public ${className} create\\(@RequestBody ${className} entity\\)`, 'g'), `public ${className}DTO create(@RequestBody ${className}DTO entity)`);
        cc = cc.replace(new RegExp(`ResponseEntity<${className}> update\\(@PathVariable String id, @RequestBody ${className} entity\\)`, 'g'), `ResponseEntity<${className}DTO> update(@PathVariable String id, @RequestBody ${className}DTO entity)`);
        
        fs.writeFileSync(controllerFile, cc);
    }
});

// Update SessionController
const sessionControllerFile = path.join(controllerDir, 'SessionController.java');
if (fs.existsSync(sessionControllerFile)) {
    let scc = fs.readFileSync(sessionControllerFile, 'utf8');
    scc = scc.replace(/import com\.settribe\.entity\.User;/, `import com.settribe.dto.UserDTO;`);
    scc = scc.replace(/User user = userService\.findByEmail/, `UserDTO user = userService.findByEmail`);
    fs.writeFileSync(sessionControllerFile, scc);
}

console.log("DTO Refactoring completed.");
