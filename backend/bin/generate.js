const fs = require('fs');
const path = require('path');

const entities = [
  {
    name: 'Project',
    fields: [
      { name: 'id', type: 'String', id: true },
      { name: 'title', type: 'String' },
      { name: 'description', type: 'String' },
      { name: 'clientName', type: 'String' },
      { name: 'category', type: 'String' },
      { name: 'priority', type: 'String' },
      { name: 'status', type: 'String' },
      { name: 'ownerId', type: 'String' },
      { name: 'managerId', type: 'String' },
      { name: 'startDate', type: 'String' },
      { name: 'endDate', type: 'String' },
      { name: 'deadline', type: 'String' },
      { name: 'repoLink', type: 'String' },
      { name: 'progress', type: 'Integer' },
      { name: 'createdAt', type: 'String' }
    ]
  },
  {
    name: 'ProjectRequirement',
    fields: [
      { name: 'id', type: 'String', id: true },
      { name: 'projectId', type: 'String' },
      { name: 'version', type: 'String' },
      { name: 'title', type: 'String' },
      { name: 'description', type: 'String' },
      { name: 'addedBy', type: 'String' },
      { name: 'addedAt', type: 'String' },
      { name: 'type', type: 'String' },
      { name: 'clientChangeNote', type: 'String' }
    ]
  },
  {
    name: 'Milestone',
    fields: [
      { name: 'id', type: 'String', id: true },
      { name: 'projectId', type: 'String' },
      { name: 'title', type: 'String' },
      { name: 'description', type: 'String' },
      { name: 'targetDate', type: 'String' },
      { name: 'actualDate', type: 'String' },
      { name: 'status', type: 'String' },
      { name: 'isLocked', type: 'Boolean' },
      { name: 'delayDays', type: 'Integer' },
      { name: 'delayReason', type: 'String' },
      { name: 'delayedAt', type: 'String' },
      { name: 'rescheduledDate', type: 'String' },
      { name: 'completionPct', type: 'Integer' },
      { name: 'milestoneOrder', type: 'Integer' } // 'order' is reserved in sql
    ]
  },
  {
    name: 'Sprint',
    fields: [
      { name: 'id', type: 'String', id: true },
      { name: 'projectId', type: 'String' },
      { name: 'name', type: 'String' },
      { name: 'goal', type: 'String' },
      { name: 'startDate', type: 'String' },
      { name: 'endDate', type: 'String' },
      { name: 'status', type: 'String' }
    ]
  },
  {
    name: 'Task',
    fields: [
      { name: 'id', type: 'String', id: true },
      { name: 'projectId', type: 'String' },
      { name: 'milestoneId', type: 'String' },
      { name: 'sprintId', type: 'String' },
      { name: 'title', type: 'String' },
      { name: 'description', type: 'String', length: 1000 },
      { name: 'priority', type: 'String' },
      { name: 'creatorId', type: 'String' },
      { name: 'assignedBy', type: 'String' },
      { name: 'status', type: 'String' },
      { name: 'startDate', type: 'String' },
      { name: 'dueDate', type: 'String' },
      { name: 'delayReason', type: 'String' },
      { name: 'newDueDate', type: 'String' },
      { name: 'isDelayed', type: 'Boolean' },
      { name: 'createdAt', type: 'String' }
    ]
  },
  {
    name: 'Meeting',
    fields: [
      { name: 'id', type: 'String', id: true },
      { name: 'title', type: 'String' },
      { name: 'agenda', type: 'String' },
      { name: 'date', type: 'String' },
      { name: 'time', type: 'String' },
      { name: 'duration', type: 'String' },
      { name: 'hostId', type: 'String' },
      { name: 'type', type: 'String' },
      { name: 'meetingMode', type: 'String' },
      { name: 'externalLink', type: 'String' },
      { name: 'projectId', type: 'String' },
      { name: 'status', type: 'String' },
      { name: 'allowJoinRequests', type: 'Boolean' },
      { name: 'createdAt', type: 'String' }
    ]
  },
  {
    name: 'MeetingRsvp',
    fields: [
      { name: 'id', type: 'String', id: true, autoGen: true }, // Add id for JPA
      { name: 'meetingId', type: 'String' },
      { name: 'userId', type: 'String' },
      { name: 'status', type: 'String' },
      { name: 'reason', type: 'String' },
      { name: 'timestamp', type: 'String' }
    ]
  },
  {
    name: 'Interview',
    fields: [
      { name: 'id', type: 'String', id: true },
      { name: 'candidateName', type: 'String' },
      { name: 'mobile', type: 'String' },
      { name: 'email', type: 'String' },
      { name: 'referredBy', type: 'String' },
      { name: 'position', type: 'String' },
      { name: 'interviewType', type: 'String' },
      { name: 'date', type: 'String' },
      { name: 'time', type: 'String' },
      { name: 'link', type: 'String' },
      { name: 'interviewerId', type: 'String' },
      { name: 'status', type: 'String' },
      { name: 'token', type: 'String' },
      { name: 'notes', type: 'String', length: 1000 },
      { name: 'resumeFileName', type: 'String' },
      { name: 'candidatePortalStatus', type: 'String' },
      { name: 'createdAt', type: 'String' }
    ]
  },
  {
    name: 'Notification',
    fields: [
      { name: 'id', type: 'String', id: true },
      { name: 'userId', type: 'String' },
      { name: 'type', type: 'String' },
      { name: 'title', type: 'String' },
      { name: 'message', type: 'String' },
      { name: 'isRead', type: 'Boolean' },
      { name: 'createdAt', type: 'String' },
      { name: 'relatedId', type: 'String' },
      { name: 'relatedType', type: 'String' }
    ]
  },
  {
    name: 'ProjectHistory',
    fields: [
      { name: 'id', type: 'String', id: true },
      { name: 'projectId', type: 'String' },
      { name: 'action', type: 'String' },
      { name: 'performedBy', type: 'String' },
      { name: 'targetId', type: 'String' },
      { name: 'targetType', type: 'String' },
      { name: 'details', type: 'String' },
      { name: 'timestamp', type: 'String' }
    ]
  },
  {
    name: 'TaskHistory',
    fields: [
      { name: 'id', type: 'String', id: true },
      { name: 'taskId', type: 'String' },
      { name: 'projectId', type: 'String' },
      { name: 'action', type: 'String' },
      { name: 'performedBy', type: 'String' },
      { name: 'fromStatus', type: 'String' },
      { name: 'toStatus', type: 'String' },
      { name: 'details', type: 'String' },
      { name: 'timestamp', type: 'String' }
    ]
  }
];

const basePath = path.join(__dirname, 'src/main/java/com/settribe');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

['entity', 'repository', 'service', 'controller', 'dto'].forEach(d => ensureDir(path.join(basePath, d)));

entities.forEach(ent => {
  // 1. Entity
  let entityCode = `package com.settribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "${ent.name.toLowerCase()}s")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ${ent.name} {
`;
  ent.fields.forEach(f => {
    if (f.id) {
      entityCode += `    @Id\n`;
      if (f.autoGen) {
        entityCode += `    @GeneratedValue(strategy = GenerationType.UUID)\n`;
      }
    }
    if (f.length) {
      entityCode += `    @Column(length = ${f.length})\n`;
    } else if (f.type === 'String') {
      entityCode += `    @Column(columnDefinition = "TEXT")\n`;
    }
    entityCode += `    private ${f.type} ${f.name};\n`;
  });
  entityCode += `}\n`;
  fs.writeFileSync(path.join(basePath, `entity/${ent.name}.java`), entityCode);

  // 2. Repository
  const idType = ent.fields.find(f => f.id).type;
  let repoCode = `package com.settribe.repository;

import com.settribe.entity.${ent.name};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${ent.name}Repository extends JpaRepository<${ent.name}, ${idType}> {
}
`;
  fs.writeFileSync(path.join(basePath, `repository/${ent.name}Repository.java`), repoCode);

  // 3. Service
  let serviceCode = `package com.settribe.service;

import com.settribe.entity.${ent.name};
import com.settribe.repository.${ent.name}Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ${ent.name}Service {

    @Autowired
    private ${ent.name}Repository repository;

    public List<${ent.name}> findAll() {
        return repository.findAll();
    }

    public Optional<${ent.name}> findById(${idType} id) {
        return repository.findById(id);
    }

    public ${ent.name} save(${ent.name} entity) {
        return repository.save(entity);
    }

    public ${ent.name} update(${idType} id, ${ent.name} entity) {
        if(repository.existsById(id)) {
            // assume entity has id set, or we could set it
            return repository.save(entity);
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(${idType} id) {
        repository.deleteById(id);
    }
}
`;
  fs.writeFileSync(path.join(basePath, `service/${ent.name}Service.java`), serviceCode);

  // 4. Controller
  let controllerCode = `package com.settribe.controller;

import com.settribe.entity.${ent.name};
import com.settribe.service.${ent.name}Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/${ent.name.toLowerCase()}s")
@CrossOrigin(origins = "*") // Allow frontend to call
public class ${ent.name}Controller {

    @Autowired
    private ${ent.name}Service service;

    @GetMapping
    public List<${ent.name}> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<${ent.name}> getById(@PathVariable ${idType} id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ${ent.name} create(@RequestBody ${ent.name} entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<${ent.name}> update(@PathVariable ${idType} id, @RequestBody ${ent.name} entity) {
        try {
            // Ensure ID is matched, you might need to set entity.setId(id) depending on structure
            return ResponseEntity.ok(service.update(id, entity));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable ${idType} id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
`;
  fs.writeFileSync(path.join(basePath, `controller/${ent.name}Controller.java`), controllerCode);
});

// Also create User Repository/Service/Controller as we wrote User entity manually
const userRepoCode = `package com.settribe.repository;
import com.settribe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    User findByEmail(String email);
}
`;
fs.writeFileSync(path.join(basePath, 'repository/UserRepository.java'), userRepoCode);

const userServiceCode = `package com.settribe.service;
import com.settribe.entity.User;
import com.settribe.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository repository;
    public List<User> findAll() { return repository.findAll(); }
    public Optional<User> findById(String id) { return repository.findById(id); }
    public User save(User entity) { return repository.save(entity); }
    public User update(String id, User entity) {
        if(repository.existsById(id)) { return repository.save(entity); }
        throw new RuntimeException("Entity not found");
    }
    public void deleteById(String id) { repository.deleteById(id); }
    public User findByEmail(String email) { return repository.findByEmail(email); }
}
`;
fs.writeFileSync(path.join(basePath, 'service/UserService.java'), userServiceCode);

const userControllerCode = `package com.settribe.controller;
import com.settribe.entity.User;
import com.settribe.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    @Autowired private UserService service;
    @GetMapping public List<User> getAll() { return service.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<User> getById(@PathVariable String id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @PostMapping public User create(@RequestBody User entity) { return service.save(entity); }
    @PutMapping("/{id}") public ResponseEntity<User> update(@PathVariable String id, @RequestBody User entity) {
        try { return ResponseEntity.ok(service.update(id, entity)); }
        catch (RuntimeException e) { return ResponseEntity.notFound().build(); }
    }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable String id) {
        service.deleteById(id); return ResponseEntity.noContent().build();
    }
}
`;
fs.writeFileSync(path.join(basePath, 'controller/UserController.java'), userControllerCode);

// Create Session Mock Controller
const sessionControllerCode = `package com.settribe.controller;
import com.settribe.entity.User;
import com.settribe.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
public class SessionController {
    @Autowired private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        User user = userService.findByEmail(email);
        if (user != null && user.getPassword().equals(password)) {
            // return a mock token and userId
            return ResponseEntity.ok(Map.of("token", "mock-jwt-token-123", "currentUserId", user.getId(), "user", user));
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
    }
}
`;
fs.writeFileSync(path.join(basePath, 'controller/SessionController.java'), sessionControllerCode);

console.log("Scaffolding complete.");
