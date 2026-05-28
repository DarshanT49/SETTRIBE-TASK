package com.settribe.controller;
import com.settribe.dto.UserDTO;
import com.settribe.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
public class SessionController {
    @Autowired private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String emailOrId = credentials.get("email");
        String password = credentials.get("password");

        // Try email first
        UserDTO user = userService.findByEmail(emailOrId);

        // Fall back to employeeId lookup if not found by email
        if (user == null) {
            user = userService.findByEmployeeId(emailOrId);
        }

        if (user == null || !user.getPassword().equals(password)) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        }

        if (user.getIsApproved() == null || !user.getIsApproved()) {
            return ResponseEntity.status(403).body(Map.of("message", "pending_approval", "userId", user.getId()));
        }

        if (user.getIsActive() == null || !user.getIsActive()) {
            return ResponseEntity.status(403).body(Map.of("message", "Account is deactivated. Please contact admin."));
        }

        // Return a simple token and user info
        String token = "token-" + user.getId() + "-" + System.currentTimeMillis();
        return ResponseEntity.ok(Map.of(
            "token", token,
            "currentUserId", user.getId(),
            "user", user
        ));
    }
}
