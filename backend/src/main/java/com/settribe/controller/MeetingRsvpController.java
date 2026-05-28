package com.settribe.controller;

import com.settribe.entity.MeetingRsvp;
import com.settribe.service.MeetingRsvpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.settribe.dto.MeetingRsvpDTO;

@RestController
@RequestMapping("/api/meetingRsvps")
@CrossOrigin(origins = "*") // Allow frontend to call
public class MeetingRsvpController {

    @Autowired
    private MeetingRsvpService service;

    @GetMapping
    public List<MeetingRsvpDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeetingRsvpDTO> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public MeetingRsvpDTO create(@RequestBody MeetingRsvpDTO entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MeetingRsvpDTO> update(@PathVariable String id, @RequestBody MeetingRsvpDTO entity) {
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
