package com.settribe.mapper;

import com.settribe.entity.ProjectRequirement;
import com.settribe.dto.ProjectRequirementDTO;

public class ProjectRequirementMapper {
    public static ProjectRequirementDTO toDTO(ProjectRequirement entity) {
        if (entity == null) return null;
        ProjectRequirementDTO dto = new ProjectRequirementDTO();
        dto.setId(entity.getId());
        dto.setProjectId(entity.getProjectId());
        dto.setVersion(entity.getVersion());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setAddedBy(entity.getAddedBy());
        dto.setAddedAt(entity.getAddedAt());
        dto.setType(entity.getType());
        dto.setClientChangeNote(entity.getClientChangeNote());
        return dto;
    }

    public static ProjectRequirement toEntity(ProjectRequirementDTO dto) {
        if (dto == null) return null;
        ProjectRequirement entity = new ProjectRequirement();
        entity.setId(dto.getId());
        entity.setProjectId(dto.getProjectId());
        entity.setVersion(dto.getVersion());
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        entity.setAddedBy(dto.getAddedBy());
        entity.setAddedAt(dto.getAddedAt());
        entity.setType(dto.getType());
        entity.setClientChangeNote(dto.getClientChangeNote());
        return entity;
    }
}
