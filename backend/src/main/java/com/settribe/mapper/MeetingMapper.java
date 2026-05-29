package com.settribe.mapper;

import com.settribe.entity.Meeting;
import com.settribe.dto.MeetingDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class MeetingMapper {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static MeetingDTO toDTO(Meeting entity) {
        if (entity == null) return null;
        MeetingDTO dto = new MeetingDTO();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setAgenda(entity.getAgenda());
        dto.setDate(entity.getDate());
        dto.setTime(entity.getTime());
        dto.setDuration(entity.getDuration());
        dto.setHostId(entity.getHostId());
        dto.setType(entity.getType());
        dto.setMeetingMode(entity.getMeetingMode());
        dto.setExternalLink(entity.getExternalLink());
        dto.setProjectId(entity.getProjectId());
        dto.setStatus(entity.getStatus());
        dto.setAllowJoinRequests(entity.getAllowJoinRequests());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setParticipantIds(parseJsonArray(entity.getParticipantIds()));
        dto.setJoinRequests(parseObjectArray(entity.getJoinRequests()));
        dto.setChatLogs(parseObjectArray(entity.getChatLogs()));
        dto.setStandupLogs(parseObjectArray(entity.getStandupLogs()));
        dto.setTaskAssignedInMeeting(parseJsonArray(entity.getTaskAssignedInMeeting()));
        dto.setAttendanceLogs(parseObjectArray(entity.getAttendanceLogs()));
        return dto;
    }

    public static Meeting toEntity(MeetingDTO dto) {
        if (dto == null) return null;
        Meeting entity = new Meeting();
        entity.setId(dto.getId());
        entity.setTitle(dto.getTitle());
        entity.setAgenda(dto.getAgenda());
        entity.setDate(dto.getDate());
        entity.setTime(dto.getTime());
        entity.setDuration(dto.getDuration());
        entity.setHostId(dto.getHostId());
        entity.setType(dto.getType());
        entity.setMeetingMode(dto.getMeetingMode());
        entity.setExternalLink(dto.getExternalLink());
        entity.setProjectId(dto.getProjectId());
        entity.setStatus(dto.getStatus());
        entity.setAllowJoinRequests(dto.getAllowJoinRequests());
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setParticipantIds(toJsonArray(dto.getParticipantIds()));
        entity.setJoinRequests(toJsonArray(dto.getJoinRequests()));
        entity.setChatLogs(toJsonArray(dto.getChatLogs()));
        entity.setStandupLogs(toJsonArray(dto.getStandupLogs()));
        entity.setTaskAssignedInMeeting(toJsonArray(dto.getTaskAssignedInMeeting()));
        entity.setAttendanceLogs(toJsonArray(dto.getAttendanceLogs()));
        return entity;
    }

    private static List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private static String toJsonArray(List<String> list) {
        if (list == null) return "[]";
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }

    private static List<Map<String, Object>> parseObjectArray(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private static String toJsonArray(Object value) {
        if (value == null) return "[]";
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return "[]";
        }
    }
}
