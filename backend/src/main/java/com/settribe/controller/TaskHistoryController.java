package com.settribe.controller;

import com.settribe.entity.TaskHistory;
import com.settribe.service.TaskHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.settribe.dto.TaskHistoryDTO;

@RestController
@RequestMapping("/api/taskHistory")
@CrossOrigin(origins = "*") // Allow frontend to call
public class TaskHistoryController {

    @Autowired
    private TaskHistoryService service;

    @GetMapping
    public List<TaskHistoryDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskHistoryDTO> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public TaskHistoryDTO create(@RequestBody TaskHistoryDTO entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskHistoryDTO> update(@PathVariable String id, @RequestBody TaskHistoryDTO entity) {
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
