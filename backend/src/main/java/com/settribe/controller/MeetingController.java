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
import com.settribe.dto.ChatMessageDTO;
import com.settribe.service.ChatMessageService;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/meetings")
public class MeetingController {

    @Autowired
    private MeetingService service;
    @Autowired
    private UserService userService;
    @Autowired
    private LiveKitTokenService liveKitTokenService;
    @Autowired
    private ChatMessageService chatMessageService;

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
            HttpServletRequest httpRequest
    ) {
        String currentUserId = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();

        MeetingDTO meeting = service.findById(id).orElse(null);
        if (meeting == null) {
            return ResponseEntity.notFound().build();
        }
        if ("external".equalsIgnoreCase(meeting.getMeetingMode())) {
            return ResponseEntity.badRequest().body(Map.of("message", "External meetings do not use the internal meeting room"));
        }
        UserDTO user = null;
        try {
            user = userService.findById(Long.parseLong(currentUserId)).orElse(null);
        } catch (NumberFormatException e) {
            // ignore
        }
        if (user == null || !Boolean.TRUE.equals(user.getIsActive()) || !Boolean.TRUE.equals(user.getIsApproved())) {
            return ResponseEntity.status(403).body(Map.of("message", "User is not allowed to join meetings"));
        }
        if (!canJoin(meeting, String.valueOf(user.getId()))) {
            return ResponseEntity.status(403).body(Map.of("message", "User is not invited to this meeting"));
        }

        String roomName = "meeting-" + id;
        String token = liveKitTokenService.createJoinToken(roomName, String.valueOf(user.getId()), user.getName());
        return ResponseEntity.ok(new MeetingJoinTokenResponse(resolveClientLiveKitUrl(httpRequest), token, roomName));
    }

    @PostMapping("/{id}/attendance/join")
    public ResponseEntity<?> markJoined(@PathVariable String id, @RequestBody MeetingAttendanceRequest request) {
        String currentUserId = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        if (request.getUserId() != null && !request.getUserId().equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("message", "Cannot mark attendance for another user"));
        }
        return updateAttendance(id, currentUserId, true);
    }

    @PostMapping("/{id}/attendance/leave")
    public ResponseEntity<?> markLeft(@PathVariable String id, @RequestBody MeetingAttendanceRequest request) {
        String currentUserId = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        if (request.getUserId() != null && !request.getUserId().equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("message", "Cannot mark attendance for another user"));
        }
        return updateAttendance(id, currentUserId, false);
    }

    @PostMapping("/{id}/attendance/absent")
    public ResponseEntity<?> markAbsent(@PathVariable String id, @RequestBody MeetingAttendanceRequest request) {
        String currentUserId = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        if (request.getUserId() != null && !request.getUserId().equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("message", "Cannot mark attendance for another user"));
        }
        
        MeetingDTO meeting = service.findById(id).orElse(null);
        if (meeting == null) return ResponseEntity.notFound().build();
        UserDTO user = null;
        try {
            user = userService.findById(Long.parseLong(currentUserId)).orElse(null);
        } catch (NumberFormatException e) {}
        if (user == null || !canJoin(meeting, currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("message", "User is not invited to this meeting"));
        }
        List<Map<String, Object>> logs = meeting.getAttendanceLogs() == null
                ? new ArrayList<>()
                : new ArrayList<>(meeting.getAttendanceLogs());
        // Only add if no existing entry for this user
        boolean alreadyLogged = logs.stream().anyMatch(l -> currentUserId.equals(String.valueOf(l.get("userId"))));
        if (!alreadyLogged) {
            java.util.LinkedHashMap<String, Object> absentLog = new java.util.LinkedHashMap<>();
            absentLog.put("userId", currentUserId);
            absentLog.put("joinTime", null);
            absentLog.put("leaveTime", null);
            absentLog.put("durationMinutes", 0);
            absentLog.put("status", "absent");
            absentLog.put("selfReported", true);
            absentLog.put("markedAt", Instant.now().toString());
            logs.add(absentLog);
            meeting.setAttendanceLogs(logs);
            return ResponseEntity.ok(service.update(id, meeting));
        }
        return ResponseEntity.ok(meeting);
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

    @PostMapping("/{id}/chat")
    public ResponseEntity<List<ChatMessageDTO>> addChatMessage(@PathVariable String id, @RequestBody ChatMessageDTO chatMessage) {
        MeetingDTO meeting = service.findById(id).orElse(null);
        if (meeting == null) {
            return ResponseEntity.notFound().build();
        }
        chatMessage.setMeetingId(id);
        chatMessageService.save(chatMessage);
        
        List<ChatMessageDTO> logs = chatMessageService.findByMeetingId(id);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/{id}/chat")
    public ResponseEntity<List<ChatMessageDTO>> getChatMessages(@PathVariable String id) {
        MeetingDTO meeting = service.findById(id).orElse(null);
        if (meeting == null) {
            return ResponseEntity.notFound().build();
        }
        List<ChatMessageDTO> logs = chatMessageService.findByMeetingId(id);
        return ResponseEntity.ok(logs);
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
        UserDTO user = null;
        try {
            user = userService.findById(Long.parseLong(userId)).orElse(null);
        } catch (NumberFormatException e) {}
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
                java.util.LinkedHashMap<String, Object> newLog = new java.util.LinkedHashMap<>();
                newLog.put("userId", userId);
                newLog.put("joinTime", Instant.now().toString());
                newLog.put("leaveTime", null);
                newLog.put("durationMinutes", 0);
                newLog.put("status", "present");
                logs.add(newLog);
            }
        } else if (activeLog != null) {
            String leaveTimeStr = Instant.now().toString();
            activeLog.put("leaveTime", leaveTimeStr);
            // Compute active duration in minutes
            try {
                Instant joinInstant = Instant.parse(String.valueOf(activeLog.get("joinTime")));
                Instant leaveInstant = Instant.parse(leaveTimeStr);
                long durationMinutes = java.time.Duration.between(joinInstant, leaveInstant).toMinutes();
                activeLog.put("durationMinutes", durationMinutes);
                // Determine status: partial if left before 80% of scheduled duration
                long scheduledMinutes = 60;
                if (meeting.getDuration() != null) {
                    try { scheduledMinutes = Long.parseLong(meeting.getDuration().toString()); } catch (Exception ignored) {}
                }
                activeLog.put("status", durationMinutes >= scheduledMinutes * 0.8 ? "present" : "partial");
            } catch (Exception e) {
                activeLog.put("durationMinutes", 0);
                activeLog.put("status", "present");
            }
        }
        meeting.setAttendanceLogs(logs);
        return ResponseEntity.ok(service.update(meetingId, meeting));
    }
}
