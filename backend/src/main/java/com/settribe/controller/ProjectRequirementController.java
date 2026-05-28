package com.settribe.controller;

import com.settribe.entity.ProjectRequirement;
import com.settribe.service.ProjectRequirementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.settribe.dto.ProjectRequirementDTO;

@RestController
@RequestMapping("/api/projectRequirements")
@CrossOrigin(origins = "*") // Allow frontend to call
public class ProjectRequirementController {

    @Autowired
    private ProjectRequirementService service;

    @GetMapping
    public List<ProjectRequirementDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectRequirementDTO> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ProjectRequirementDTO create(@RequestBody ProjectRequirementDTO entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectRequirementDTO> update(@PathVariable String id, @RequestBody ProjectRequirementDTO entity) {
        try {
            // Ensure ID is matched, you might need to set entity.setId(id) depending on structure
            return ResponseEntity.ok(service.update(id, entity));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
