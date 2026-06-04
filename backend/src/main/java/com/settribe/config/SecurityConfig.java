package com.settribe.config;

import com.settribe.security.CustomUserDetailsService;
import com.settribe.security.JwtAuthenticationEntryPoint;
import com.settribe.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.Customizer;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private JwtAuthenticationEntryPoint unauthorizedHandler;

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder authManagerBuilder = http.getSharedObject(AuthenticationManagerBuilder.class);
        authManagerBuilder
            .userDetailsService(customUserDetailsService)
            .passwordEncoder(passwordEncoder());
        return authManagerBuilder.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Apply global CORS config from CorsConfig.java
            .cors(Customizer.withDefaults())
            // Disable CSRF — we use stateless JWT
            .csrf(csrf -> csrf.disable())
            // Return 401 JSON on unauthenticated requests
            .exceptionHandling(ex -> ex.authenticationEntryPoint(unauthorizedHandler))
            // No server-side sessions — purely stateless JWT
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authorize -> authorize
                // ─── Public endpoints ───
                .requestMatchers("/api/auth/**").permitAll()               // Login
                .requestMatchers("/api/registration-requests/**").permitAll() // Self-registration
                .requestMatchers("/api/registrationRequests/**").permitAll()   // Alternate casing used by frontend
                .requestMatchers("/ws-chat/**").permitAll()                // WebSocket handshake
                .requestMatchers("/actuator/health").permitAll()           // Health check (Render)
                .requestMatchers("/api/interviews/validate").permitAll()   // Interview candidate join
                .requestMatchers("/api/interviews/*/join-token").permitAll() // Interview candidate token
                // ─── Everything else requires a valid JWT ───
                .anyRequest().authenticated()
            );

        // Add JWT filter before the standard UsernamePasswordAuthenticationFilter
        http.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
