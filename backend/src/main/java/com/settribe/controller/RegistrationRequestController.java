package com.settribe.controller;

import com.settribe.service.RegistrationRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.settribe.dto.RegistrationRequestDTO;

@RestController
@RequestMapping("/api/registrationRequests")
@CrossOrigin(origins = "*")
public class RegistrationRequestController {

    @Autowired
    private RegistrationRequestService service;

    @GetMapping
    public List<RegistrationRequestDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegistrationRequestDTO> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public RegistrationRequestDTO create(@RequestBody RegistrationRequestDTO entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RegistrationRequestDTO> update(@PathVariable String id, @RequestBody RegistrationRequestDTO entity) {
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
