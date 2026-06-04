package com.settribe.controller;

import com.settribe.entity.User;
import com.settribe.repository.UserRepository;
import com.settribe.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private com.settribe.repository.RegistrationRequestRepository registrationRequestRepository;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {
        String identifier = loginRequest.get("userId");
        String password = loginRequest.get("password");

        if (identifier == null || identifier.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
        }
        if (password == null) password = "";

        // Step 1: Authenticate via Spring Security (validates BCrypt password)
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(identifier, password)
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        }

        // Step 2: Extract the actual user ID from the authenticated principal
        String actualUserId = ((org.springframework.security.core.userdetails.User) authentication.getPrincipal()).getUsername();

        // Step 3: Check approval and active status
        User user = null;
        try {
            user = userRepository.findById(Long.parseLong(actualUserId)).orElse(null);
        } catch (NumberFormatException e) {
            // ignore
        }
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "User not found"));
        }
        if (user.getIsApproved() == null || !user.getIsApproved()) {
            return ResponseEntity.status(403).body(Map.of(
                "message", "pending_approval",
                "userId", user.getId()
            ));
        }
        if (user.getIsActive() == null || !user.getIsActive()) {
            return ResponseEntity.status(403).body(Map.of(
                "message", "Account is deactivated. Please contact your administrator."
            ));
        }

        // Step 4: Generate JWT and return
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        return ResponseEntity.ok(Map.of(
            "token", jwt,
            "userId", actualUserId,
            "role", user.getRole()
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> userData = (Map<String, Object>) payload.get("user");
            Map<String, Object> regData = (Map<String, Object>) payload.get("registrationRequest");

            String email = (String) userData.get("email");
            String employeeId = (String) userData.get("employeeId");

            if (userRepository.findByEmail(email) != null || userRepository.findByEmployeeId(employeeId) != null) {
                return ResponseEntity.status(409).body(Map.of("message", "Email or Employee ID already registered."));
            }

            User user = new User();
            user.setName((String) userData.get("name"));
            user.setEmployeeId(employeeId);
            user.setEmail(email);
            user.setMobile((String) userData.get("mobile"));
            user.setDepartment((String) userData.get("department"));
            user.setRole((String) userData.get("role"));
            user.setIsActive((Boolean) userData.get("isActive"));
            user.setIsApproved((Boolean) userData.get("isApproved"));
            user.setCreatedAt((String) userData.get("createdAt"));
            user.setPassword(passwordEncoder.encode((String) userData.get("password")));
            
            userRepository.save(user);

            com.settribe.entity.RegistrationRequest req = new com.settribe.entity.RegistrationRequest();
            req.setId((String) regData.get("id"));
            req.setUserId(String.valueOf(user.getId()));
            req.setStatus((String) regData.get("status"));
            req.setRequestedAt((String) regData.get("requestedAt"));
            req.setRejectionReason((String) regData.get("rejectionReason"));
            
            registrationRequestRepository.save(req);

            return ResponseEntity.ok(Map.of("success", true, "user", user));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Registration failed"));
        }
    }
}
