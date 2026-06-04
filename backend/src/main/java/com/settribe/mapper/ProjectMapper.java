package com.settribe.mapper;

import com.settribe.entity.Project;
import com.settribe.dto.ProjectDTO;
public class ProjectMapper {

    public static ProjectDTO toDTO(Project entity) {
        if (entity == null) return null;
        ProjectDTO dto = new ProjectDTO();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setClientName(entity.getClientName());
        dto.setCategory(entity.getCategory());
        dto.setPriority(entity.getPriority());
        dto.setStatus(entity.getStatus());
        dto.setOwnerId(entity.getOwnerId());
        dto.setManagerId(entity.getManagerId());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setDeadline(entity.getDeadline());
        dto.setRepoLink(entity.getRepoLink());
        dto.setProgress(entity.getProgress());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    public static Project toEntity(ProjectDTO dto) {
        if (dto == null) return null;
        Project entity = new Project();
        entity.setId(dto.getId());
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        entity.setClientName(dto.getClientName());
        entity.setCategory(dto.getCategory());
        entity.setPriority(dto.getPriority());
        entity.setStatus(dto.getStatus());
        entity.setOwnerId(dto.getOwnerId());
        entity.setManagerId(dto.getManagerId());
        entity.setStartDate(dto.getStartDate());
        entity.setEndDate(dto.getEndDate());
        entity.setDeadline(dto.getDeadline());
        entity.setRepoLink(dto.getRepoLink());
        entity.setProgress(dto.getProgress());
        entity.setCreatedAt(dto.getCreatedAt());
        return entity;
    }
}
