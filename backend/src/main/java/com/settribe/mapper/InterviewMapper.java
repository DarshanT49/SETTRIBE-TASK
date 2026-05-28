package com.settribe.mapper;

import com.settribe.entity.Interview;
import com.settribe.dto.InterviewDTO;

public class InterviewMapper {
    public static InterviewDTO toDTO(Interview entity) {
        if (entity == null) return null;
        InterviewDTO dto = new InterviewDTO();
        dto.setId(entity.getId());
        dto.setCandidateName(entity.getCandidateName());
        dto.setMobile(entity.getMobile());
        dto.setEmail(entity.getEmail());
        dto.setReferredBy(entity.getReferredBy());
        dto.setPosition(entity.getPosition());
        dto.setInterviewType(entity.getInterviewType());
        dto.setDate(entity.getDate());
        dto.setTime(entity.getTime());
        dto.setLink(entity.getLink());
        dto.setInterviewerId(entity.getInterviewerId());
        dto.setStatus(entity.getStatus());
        dto.setToken(entity.getToken());
        dto.setNotes(entity.getNotes());
        dto.setResumeFileName(entity.getResumeFileName());
        dto.setCandidatePortalStatus(entity.getCandidatePortalStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    public static Interview toEntity(InterviewDTO dto) {
        if (dto == null) return null;
        Interview entity = new Interview();
        entity.setId(dto.getId());
        entity.setCandidateName(dto.getCandidateName());
        entity.setMobile(dto.getMobile());
        entity.setEmail(dto.getEmail());
        entity.setReferredBy(dto.getReferredBy());
        entity.setPosition(dto.getPosition());
        entity.setInterviewType(dto.getInterviewType());
        entity.setDate(dto.getDate());
        entity.setTime(dto.getTime());
        entity.setLink(dto.getLink());
        entity.setInterviewerId(dto.getInterviewerId());
        entity.setStatus(dto.getStatus());
        entity.setToken(dto.getToken());
        entity.setNotes(dto.getNotes());
        entity.setResumeFileName(dto.getResumeFileName());
        entity.setCandidatePortalStatus(dto.getCandidatePortalStatus());
        entity.setCreatedAt(dto.getCreatedAt());
        return entity;
    }
}
