package com.settribe.mapper;

import com.settribe.entity.Task;
import com.settribe.dto.TaskDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;

public class TaskMapper {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static TaskDTO toDTO(Task entity) {
        if (entity == null) return null;
        TaskDTO dto = new TaskDTO();
        dto.setId(entity.getId());
        dto.setProjectId(entity.getProjectId());
        dto.setMilestoneId(entity.getMilestoneId());
        dto.setSprintId(entity.getSprintId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setPriority(entity.getPriority());
        dto.setCreatorId(entity.getCreatorId());
        dto.setAssignedBy(entity.getAssignedBy());
        dto.setStatus(entity.getStatus());
        dto.setStartDate(entity.getStartDate());
        dto.setDueDate(entity.getDueDate());
        dto.setDelayReason(entity.getDelayReason());
        dto.setNewDueDate(entity.getNewDueDate());
        dto.setIsDelayed(entity.getIsDelayed());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setAssigneeIds(parseJsonArray(entity.getAssigneeIds()));
        return dto;
    }

    public static Task toEntity(TaskDTO dto) {
        if (dto == null) return null;
        Task entity = new Task();
        entity.setId(dto.getId());
        entity.setProjectId(dto.getProjectId());
        entity.setMilestoneId(dto.getMilestoneId());
        entity.setSprintId(dto.getSprintId());
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        entity.setPriority(dto.getPriority());
        entity.setCreatorId(dto.getCreatorId());
        entity.setAssignedBy(dto.getAssignedBy());
        entity.setStatus(dto.getStatus());
        entity.setStartDate(dto.getStartDate());
        entity.setDueDate(dto.getDueDate());
        entity.setDelayReason(dto.getDelayReason());
        entity.setNewDueDate(dto.getNewDueDate());
        entity.setIsDelayed(dto.getIsDelayed());
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setAssigneeIds(toJsonArray(dto.getAssigneeIds()));
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
}
