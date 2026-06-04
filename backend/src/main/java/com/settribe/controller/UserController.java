package com.settribe.controller;

import com.settribe.dto.UserDTO;
import com.settribe.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService service;

    // Any authenticated user can view the user list (needed for team lookups, mentions, etc.)
    @GetMapping
    public List<UserDTO> getAll() {
        return service.findAll();
    }

    // Any authenticated user can view their own or others' profiles
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Only Admin or HR can create new users directly (registration goes through /api/auth)
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public UserDTO create(@RequestBody UserDTO entity) {
        return service.save(entity);
    }

    // Any authenticated user can update (used for self-profile edits);
    // Sensitive field locks (role, approval) are enforced in service layer
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> update(@PathVariable Long id, @RequestBody UserDTO entity) {
        try {
            return ResponseEntity.ok(service.update(id, entity));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Only Admin can permanently delete users
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
