package com.settribe.controller;

import com.settribe.entity.Meeting;
import com.settribe.dto.MeetingAttendanceRequest;
import com.settribe.service.MeetingService;
import com.settribe.service.LiveKitTokenService;
import com.settribe.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.settribe.dto.MeetingDTO;
import com.settribe.dto.MeetingJoinTokenRequest;
import com.settribe.dto.MeetingJoinTokenResponse;
import com.settribe.dto.UserDTO;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/meetings")
@CrossOrigin(origins = "*") // Allow frontend to call
public class MeetingController {

    @Autowired
    private MeetingService service;
    @Autowired
    private UserService userService;
    @Autowired
    private LiveKitTokenService liveKitTokenService;

    @GetMapping
    public List<MeetingDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeetingDTO> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public MeetingDTO create(@RequestBody MeetingDTO entity) {
        return service.save(entity);
    }

    @PostMapping("/{id}/join-token")
    public ResponseEntity<?> createJoinToken(
            @PathVariable String id,
            @RequestBody MeetingJoinTokenRequest request,
            HttpServletRequest httpRequest
    ) {
        MeetingDTO meeting = service.findById(id).orElse(null);
        if (meeting == null) {
            return ResponseEntity.notFound().build();
        }
        if ("external".equalsIgnoreCase(meeting.getMeetingMode())) {
            return ResponseEntity.badRequest().body(Map.of("message", "External meetings do not use the internal meeting room"));
        }
        UserDTO user = userService.findById(request.getUserId()).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getIsActive()) || !Boolean.TRUE.equals(user.getIsApproved())) {
            return ResponseEntity.status(403).body(Map.of("message", "User is not allowed to join meetings"));
        }
        if (!canJoin(meeting, user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "User is not invited to this meeting"));
        }

        String roomName = "meeting-" + id;
        String token = liveKitTokenService.createJoinToken(roomName, user.getId(), user.getName());
        return ResponseEntity.ok(new MeetingJoinTokenResponse(resolveClientLiveKitUrl(httpRequest), token, roomName));
    }

    @PostMapping("/{id}/attendance/join")
    public ResponseEntity<?> markJoined(@PathVariable String id, @RequestBody MeetingAttendanceRequest request) {
        return updateAttendance(id, request.getUserId(), true);
    }

    @PostMapping("/{id}/attendance/leave")
    public ResponseEntity<?> markLeft(@PathVariable String id, @RequestBody MeetingAttendanceRequest request) {
        return updateAttendance(id, request.getUserId(), false);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MeetingDTO> update(@PathVariable String id, @RequestBody MeetingDTO entity) {
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

    private boolean canJoin(MeetingDTO meeting, String userId) {
        if (userId == null) return false;
        if (userId.equals(meeting.getHostId())) return true;
        if (meeting.getParticipantIds() != null && meeting.getParticipantIds().contains(userId)) return true;
        if (meeting.getJoinRequests() == null) return false;
        return meeting.getJoinRequests().stream().anyMatch(request ->
                userId.equals(String.valueOf(request.get("userId"))) &&
                        "approved".equalsIgnoreCase(String.valueOf(request.get("status")))
        );
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

    private ResponseEntity<?> updateAttendance(String meetingId, String userId, boolean joined) {
        MeetingDTO meeting = service.findById(meetingId).orElse(null);
        if (meeting == null) {
            return ResponseEntity.notFound().build();
        }
        UserDTO user = userService.findById(userId).orElse(null);
        if (user == null || !canJoin(meeting, userId)) {
            return ResponseEntity.status(403).body(Map.of("message", "User is not invited to this meeting"));
        }

        List<Map<String, Object>> logs = meeting.getAttendanceLogs() == null
                ? new ArrayList<>()
                : new ArrayList<>(meeting.getAttendanceLogs());
        Map<String, Object> activeLog = null;
        for (int i = logs.size() - 1; i >= 0; i--) {
            Map<String, Object> log = logs.get(i);
            if (userId.equals(String.valueOf(log.get("userId"))) && log.get("leaveTime") == null) {
                activeLog = log;
                break;
            }
        }
        if (joined) {
            if (activeLog == null) {
                logs.add(new java.util.LinkedHashMap<>(Map.of(
                        "userId", userId,
                        "joinTime", Instant.now().toString()
                )));
            }
        } else if (activeLog != null) {
            activeLog.put("leaveTime", Instant.now().toString());
        }
        meeting.setAttendanceLogs(logs);
        return ResponseEntity.ok(service.update(meetingId, meeting));
    }
}
