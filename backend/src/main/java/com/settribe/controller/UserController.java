package com.settribe.controller;
import com.settribe.entity.User;
import com.settribe.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.settribe.dto.UserDTO;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    @Autowired private UserService service;
    @GetMapping public List<UserDTO> getAll() { return service.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<UserDTO> getById(@PathVariable String id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @PostMapping public UserDTO create(@RequestBody UserDTO entity) { return service.save(entity); }
    @PutMapping("/{id}") public ResponseEntity<UserDTO> update(@PathVariable String id, @RequestBody UserDTO entity) {
        try { return ResponseEntity.ok(service.update(id, entity)); }
        catch (RuntimeException e) { return ResponseEntity.notFound().build(); }
    }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable String id) {
        service.deleteById(id); return ResponseEntity.noContent().build();
    }
}
