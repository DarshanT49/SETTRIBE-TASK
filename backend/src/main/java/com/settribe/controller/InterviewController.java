package com.settribe.controller;

import com.settribe.entity.Interview;
import com.settribe.service.InterviewService;
import com.settribe.service.LiveKitTokenService;
import com.settribe.dto.MeetingJoinTokenRequest;
import com.settribe.dto.MeetingJoinTokenResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import com.settribe.dto.InterviewDTO;

@RestController
@RequestMapping("/api/interviews")
@CrossOrigin(origins = "*") // Allow frontend to call
public class InterviewController {

    @Autowired
    private InterviewService service;

    @Autowired
    private LiveKitTokenService liveKitTokenService;

    @GetMapping
    public List<InterviewDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<InterviewDTO> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public InterviewDTO create(@RequestBody InterviewDTO entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InterviewDTO> update(@PathVariable String id, @RequestBody InterviewDTO entity) {
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

    @PostMapping("/{id}/start")
    public ResponseEntity<InterviewDTO> startInterview(@PathVariable String id) {
        try {
            return ResponseEntity.ok(service.startInterview(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<InterviewDTO> endInterview(@PathVariable String id) {
        try {
            return ResponseEntity.ok(service.endInterview(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validate(@RequestParam String token) {
        try {
            InterviewDTO dto = service.validateToken(token);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping("/{id}/join-token")
    public ResponseEntity<?> createJoinToken(
            @PathVariable String id,
            @RequestBody MeetingJoinTokenRequest request,
            HttpServletRequest httpRequest
    ) {
        InterviewDTO interview = service.findById(id).orElse(null);
        if (interview == null) {
            return ResponseEntity.notFound().build();
        }

        // We use the interview's associated meetingId for the room name.
        // If it doesn't exist, we just fallback to the interview ID (though Meeting ID is expected).
        String meetingId = interview.getMeetingId() != null ? interview.getMeetingId() : id;
        String roomName = "meeting-" + meetingId;

        // No RBAC checks - allow anyone with the link to get a token using their chosen name.
        String token = liveKitTokenService.createJoinToken(roomName, request.getUserId(), request.getDisplayName());
        
        return ResponseEntity.ok(new MeetingJoinTokenResponse(resolveClientLiveKitUrl(httpRequest), token, roomName));
    }

    private String resolveClientLiveKitUrl(HttpServletRequest request) {
        String configuredUrl = liveKitTokenService.getLiveKitUrl();
        if (configuredUrl == null || configuredUrl.isBlank()) {
            configuredUrl = "ws://localhost:7880";
        }

        String normalizedUrl = configuredUrl.toLowerCase();
        boolean isLocalOnlyUrl = normalizedUrl.contains("://localhost")
                || normalizedUrl.contains("://127.0.0.1")
                || normalizedUrl.contains("://0.0.0.0");
        if (!isLocalOnlyUrl) {
            return configuredUrl;
        }

        String requestHost = request.getServerName();
        if (requestHost == null || requestHost.isBlank()) {
            return configuredUrl;
        }

        String scheme = configuredUrl.startsWith("wss://") ? "wss" : "ws";
        String port = "7880";
        int lastColon = configuredUrl.lastIndexOf(':');
        int pathStart = configuredUrl.indexOf('/', configuredUrl.indexOf("://") + 3);
        if (lastColon > configuredUrl.indexOf("://") + 2) {
            int portEnd = pathStart > lastColon ? pathStart : configuredUrl.length();
            port = configuredUrl.substring(lastColon + 1, portEnd);
        }

        return scheme + "://" + requestHost + ":" + port;
    }
}
