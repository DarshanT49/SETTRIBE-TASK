package com.settribe.controller;

import com.settribe.entity.Meeting;
import com.settribe.service.MeetingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.settribe.dto.MeetingDTO;

@RestController
@RequestMapping("/api/meetings")
@CrossOrigin(origins = "*") // Allow frontend to call
public class MeetingController {

    @Autowired
    private MeetingService service;

    @GetMapping
    public List<MeetingDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeetingDTO> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public MeetingDTO create(@RequestBody MeetingDTO entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MeetingDTO> update(@PathVariable String id, @RequestBody MeetingDTO entity) {
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
