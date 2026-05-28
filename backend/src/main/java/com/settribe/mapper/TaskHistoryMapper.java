package com.settribe.mapper;

import com.settribe.entity.TaskHistory;
import com.settribe.dto.TaskHistoryDTO;

public class TaskHistoryMapper {
    public static TaskHistoryDTO toDTO(TaskHistory entity) {
        if (entity == null) return null;
        TaskHistoryDTO dto = new TaskHistoryDTO();
        dto.setId(entity.getId());
        dto.setTaskId(entity.getTaskId());
        dto.setProjectId(entity.getProjectId());
        dto.setAction(entity.getAction());
        dto.setPerformedBy(entity.getPerformedBy());
        dto.setFromStatus(entity.getFromStatus());
        dto.setToStatus(entity.getToStatus());
        dto.setDetails(entity.getDetails());
        dto.setTimestamp(entity.getTimestamp());
        return dto;
    }

    public static TaskHistory toEntity(TaskHistoryDTO dto) {
        if (dto == null) return null;
        TaskHistory entity = new TaskHistory();
        entity.setId(dto.getId());
        entity.setTaskId(dto.getTaskId());
        entity.setProjectId(dto.getProjectId());
        entity.setAction(dto.getAction());
        entity.setPerformedBy(dto.getPerformedBy());
        entity.setFromStatus(dto.getFromStatus());
        entity.setToStatus(dto.getToStatus());
        entity.setDetails(dto.getDetails());
        entity.setTimestamp(dto.getTimestamp());
        return entity;
    }
}
