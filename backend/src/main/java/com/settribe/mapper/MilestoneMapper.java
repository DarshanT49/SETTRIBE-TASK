package com.settribe.mapper;

import com.settribe.entity.Milestone;
import com.settribe.dto.MilestoneDTO;

public class MilestoneMapper {
    public static MilestoneDTO toDTO(Milestone entity) {
        if (entity == null) return null;
        MilestoneDTO dto = new MilestoneDTO();
        dto.setId(entity.getId());
        dto.setProjectId(entity.getProjectId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setTargetDate(entity.getTargetDate());
        dto.setActualDate(entity.getActualDate());
        dto.setStatus(entity.getStatus());
        dto.setIsLocked(entity.getIsLocked());
        dto.setDelayDays(entity.getDelayDays());
        dto.setDelayReason(entity.getDelayReason());
        dto.setDelayedAt(entity.getDelayedAt());
        dto.setRescheduledDate(entity.getRescheduledDate());
        dto.setCompletionPct(entity.getCompletionPct());
        dto.setMilestoneOrder(entity.getMilestoneOrder());
        return dto;
    }

    public static Milestone toEntity(MilestoneDTO dto) {
        if (dto == null) return null;
        Milestone entity = new Milestone();
        entity.setId(dto.getId());
        entity.setProjectId(dto.getProjectId());
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        entity.setTargetDate(dto.getTargetDate());
        entity.setActualDate(dto.getActualDate());
        entity.setStatus(dto.getStatus());
        entity.setIsLocked(dto.getIsLocked());
        entity.setDelayDays(dto.getDelayDays());
        entity.setDelayReason(dto.getDelayReason());
        entity.setDelayedAt(dto.getDelayedAt());
        entity.setRescheduledDate(dto.getRescheduledDate());
        entity.setCompletionPct(dto.getCompletionPct());
        entity.setMilestoneOrder(dto.getMilestoneOrder());
        return entity;
    }
}
