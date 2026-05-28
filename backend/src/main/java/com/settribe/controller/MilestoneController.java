package com.settribe.controller;

import com.settribe.entity.Milestone;
import com.settribe.service.MilestoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.settribe.dto.MilestoneDTO;

@RestController
@RequestMapping("/api/milestones")
@CrossOrigin(origins = "*") // Allow frontend to call
public class MilestoneController {

    @Autowired
    private MilestoneService service;

    @GetMapping
    public List<MilestoneDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MilestoneDTO> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public MilestoneDTO create(@RequestBody MilestoneDTO entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MilestoneDTO> update(@PathVariable String id, @RequestBody MilestoneDTO entity) {
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
