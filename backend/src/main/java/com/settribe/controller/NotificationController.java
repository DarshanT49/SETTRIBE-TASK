package com.settribe.controller;

import com.settribe.entity.Notification;
import com.settribe.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.settribe.dto.NotificationDTO;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*") // Allow frontend to call
public class NotificationController {

    @Autowired
    private NotificationService service;

    @GetMapping
    public List<NotificationDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationDTO> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public NotificationDTO create(@RequestBody NotificationDTO entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NotificationDTO> update(@PathVariable String id, @RequestBody NotificationDTO entity) {
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
