package com.settribe.mapper;

import com.settribe.entity.Notification;
import com.settribe.dto.NotificationDTO;

public class NotificationMapper {
    public static NotificationDTO toDTO(Notification entity) {
        if (entity == null) return null;
        NotificationDTO dto = new NotificationDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setType(entity.getType());
        dto.setTitle(entity.getTitle());
        dto.setMessage(entity.getMessage());
        dto.setIsRead(entity.getIsRead());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setRelatedId(entity.getRelatedId());
        dto.setRelatedType(entity.getRelatedType());
        return dto;
    }

    public static Notification toEntity(NotificationDTO dto) {
        if (dto == null) return null;
        Notification entity = new Notification();
        entity.setId(dto.getId());
        entity.setUserId(dto.getUserId());
        entity.setType(dto.getType());
        entity.setTitle(dto.getTitle());
        entity.setMessage(dto.getMessage());
        entity.setIsRead(dto.getIsRead());
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setRelatedId(dto.getRelatedId());
        entity.setRelatedType(dto.getRelatedType());
        return entity;
    }
}
