package com.settribe.mapper;

import com.settribe.entity.Sprint;
import com.settribe.dto.SprintDTO;

public class SprintMapper {
    public static SprintDTO toDTO(Sprint entity) {
        if (entity == null) return null;
        SprintDTO dto = new SprintDTO();
        dto.setId(entity.getId());
        dto.setProjectId(entity.getProjectId());
        dto.setName(entity.getName());
        dto.setGoal(entity.getGoal());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setStatus(entity.getStatus());
        return dto;
    }

    public static Sprint toEntity(SprintDTO dto) {
        if (dto == null) return null;
        Sprint entity = new Sprint();
        entity.setId(dto.getId());
        entity.setProjectId(dto.getProjectId());
        entity.setName(dto.getName());
        entity.setGoal(dto.getGoal());
        entity.setStartDate(dto.getStartDate());
        entity.setEndDate(dto.getEndDate());
        entity.setStatus(dto.getStatus());
        return entity;
    }
}
