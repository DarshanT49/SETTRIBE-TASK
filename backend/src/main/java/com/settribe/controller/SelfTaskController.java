package com.settribe.controller;

import com.settribe.service.SelfTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.settribe.dto.SelfTaskDTO;

@RestController
@RequestMapping("/api/selfTasks")
@CrossOrigin(origins = "*")
public class SelfTaskController {

    @Autowired
    private SelfTaskService service;

    @GetMapping
    public List<SelfTaskDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SelfTaskDTO> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public SelfTaskDTO create(@RequestBody SelfTaskDTO entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SelfTaskDTO> update(@PathVariable String id, @RequestBody SelfTaskDTO entity) {
        try {
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
