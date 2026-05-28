package com.settribe.controller;

import com.settribe.entity.ProjectHistory;
import com.settribe.service.ProjectHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.settribe.dto.ProjectHistoryDTO;

@RestController
@RequestMapping("/api/projectHistory")
@CrossOrigin(origins = "*") // Allow frontend to call
public class ProjectHistoryController {

    @Autowired
    private ProjectHistoryService service;

    @GetMapping
    public List<ProjectHistoryDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectHistoryDTO> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ProjectHistoryDTO create(@RequestBody ProjectHistoryDTO entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectHistoryDTO> update(@PathVariable String id, @RequestBody ProjectHistoryDTO entity) {
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
