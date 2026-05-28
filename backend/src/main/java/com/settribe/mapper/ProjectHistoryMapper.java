package com.settribe.mapper;

import com.settribe.entity.ProjectHistory;
import com.settribe.dto.ProjectHistoryDTO;

public class ProjectHistoryMapper {
    public static ProjectHistoryDTO toDTO(ProjectHistory entity) {
        if (entity == null) return null;
        ProjectHistoryDTO dto = new ProjectHistoryDTO();
        dto.setId(entity.getId());
        dto.setProjectId(entity.getProjectId());
        dto.setAction(entity.getAction());
        dto.setPerformedBy(entity.getPerformedBy());
        dto.setTargetId(entity.getTargetId());
        dto.setTargetType(entity.getTargetType());
        dto.setDetails(entity.getDetails());
        dto.setTimestamp(entity.getTimestamp());
        return dto;
    }

    public static ProjectHistory toEntity(ProjectHistoryDTO dto) {
        if (dto == null) return null;
        ProjectHistory entity = new ProjectHistory();
        entity.setId(dto.getId());
        entity.setProjectId(dto.getProjectId());
        entity.setAction(dto.getAction());
        entity.setPerformedBy(dto.getPerformedBy());
        entity.setTargetId(dto.getTargetId());
        entity.setTargetType(dto.getTargetType());
        entity.setDetails(dto.getDetails());
        entity.setTimestamp(dto.getTimestamp());
        return entity;
    }
}
