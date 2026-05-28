package com.settribe.mapper;

import com.settribe.entity.User;
import com.settribe.dto.UserDTO;

public class UserMapper {
    public static UserDTO toDTO(User entity) {
        if (entity == null) return null;
        UserDTO dto = new UserDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setEmployeeId(entity.getEmployeeId());
        dto.setEmail(entity.getEmail());
        dto.setMobile(entity.getMobile());
        dto.setDepartment(entity.getDepartment());
        dto.setRole(entity.getRole());
        dto.setIsActive(entity.getIsActive());
        dto.setIsApproved(entity.getIsApproved());
        dto.setApprovedBy(entity.getApprovedBy());
        dto.setApprovedAt(entity.getApprovedAt());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setProfilePhoto(entity.getProfilePhoto());
        dto.setPassword(entity.getPassword());
        return dto;
    }

    public static User toEntity(UserDTO dto) {
        if (dto == null) return null;
        User entity = new User();
        entity.setId(dto.getId());
        entity.setName(dto.getName());
        entity.setEmployeeId(dto.getEmployeeId());
        entity.setEmail(dto.getEmail());
        entity.setMobile(dto.getMobile());
        entity.setDepartment(dto.getDepartment());
        entity.setRole(dto.getRole());
        entity.setIsActive(dto.getIsActive());
        entity.setIsApproved(dto.getIsApproved());
        entity.setApprovedBy(dto.getApprovedBy());
        entity.setApprovedAt(dto.getApprovedAt());
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setProfilePhoto(dto.getProfilePhoto());
        entity.setPassword(dto.getPassword());
        return entity;
    }
}
