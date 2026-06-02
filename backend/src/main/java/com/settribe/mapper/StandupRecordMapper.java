package com.settribe.mapper;

import com.settribe.dto.StandupRecordDTO;
import com.settribe.entity.StandupRecord;
import org.springframework.stereotype.Component;

@Component
public class StandupRecordMapper {

    public StandupRecordDTO toDTO(StandupRecord entity) {
        if (entity == null) {
            return null;
        }
        return new StandupRecordDTO(
                entity.getId(),
                entity.getMeetingId(),
                entity.getUserId(),
                entity.getContent(),
                entity.getCreatedAt()
        );
    }

    public StandupRecord toEntity(StandupRecordDTO dto) {
        if (dto == null) {
            return null;
        }
        StandupRecord entity = new StandupRecord();
        entity.setId(dto.getId());
        entity.setMeetingId(dto.getMeetingId());
        entity.setUserId(dto.getUserId());
        entity.setContent(dto.getContent());
        entity.setCreatedAt(dto.getCreatedAt());
        return entity;
    }
}
