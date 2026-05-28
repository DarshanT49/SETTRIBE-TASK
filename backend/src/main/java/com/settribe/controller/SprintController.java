package com.settribe.controller;

import com.settribe.entity.Sprint;
import com.settribe.service.SprintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.settribe.dto.SprintDTO;

@RestController
@RequestMapping("/api/sprints")
@CrossOrigin(origins = "*") // Allow frontend to call
public class SprintController {

    @Autowired
    private SprintService service;

    @GetMapping
    public List<SprintDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SprintDTO> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public SprintDTO create(@RequestBody SprintDTO entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SprintDTO> update(@PathVariable String id, @RequestBody SprintDTO entity) {
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
