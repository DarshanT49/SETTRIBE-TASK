package com.settribe.security;

import com.settribe.entity.User;
import com.settribe.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        // Support login via email, employeeId, or userId (UUID)
        User user = userRepository.findByEmail(identifier);

        if (user == null) {
            user = userRepository.findByEmployeeId(identifier);
        }

        if (user == null) {
            try {
                user = userRepository.findById(Long.parseLong(identifier)).orElse(null);
            } catch (NumberFormatException e) {
                // Ignore
            }
        }

        if (user == null) {
            throw new UsernameNotFoundException("User not found: " + identifier);
        }

        // Map the user's role to a Spring Security GrantedAuthority
        // e.g. "admin" → ROLE_ADMIN, "manager" → ROLE_MANAGER
        String roleName = (user.getRole() != null ? user.getRole() : "employee").toUpperCase();
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + roleName));

        // Return Spring Security UserDetails using the User's UUID as the principal name
        // This ensures the JWT subject is always the UUID, never the email
        return new org.springframework.security.core.userdetails.User(
                String.valueOf(user.getId()),
                user.getPassword() != null ? user.getPassword() : "",
                authorities
        );
    }
}
