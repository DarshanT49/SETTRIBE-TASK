package com.settribe.mapper;

import com.settribe.entity.MeetingRsvp;
import com.settribe.dto.MeetingRsvpDTO;

public class MeetingRsvpMapper {
    public static MeetingRsvpDTO toDTO(MeetingRsvp entity) {
        if (entity == null) return null;
        MeetingRsvpDTO dto = new MeetingRsvpDTO();
        dto.setId(entity.getId());
        dto.setMeetingId(entity.getMeetingId());
        dto.setUserId(entity.getUserId());
        dto.setStatus(entity.getStatus());
        dto.setReason(entity.getReason());
        dto.setTimestamp(entity.getTimestamp());
        return dto;
    }

    public static MeetingRsvp toEntity(MeetingRsvpDTO dto) {
        if (dto == null) return null;
        MeetingRsvp entity = new MeetingRsvp();
        entity.setId(dto.getId());
        entity.setMeetingId(dto.getMeetingId());
        entity.setUserId(dto.getUserId());
        entity.setStatus(dto.getStatus());
        entity.setReason(dto.getReason());
        entity.setTimestamp(dto.getTimestamp());
        return entity;
    }
}
