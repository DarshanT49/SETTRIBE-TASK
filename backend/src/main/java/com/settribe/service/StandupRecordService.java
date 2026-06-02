package com.settribe.service;

import com.settribe.dto.StandupRecordDTO;
import com.settribe.entity.StandupRecord;
import com.settribe.mapper.StandupRecordMapper;
import com.settribe.repository.StandupRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StandupRecordService {

    @Autowired
    private StandupRecordRepository repository;

    @Autowired
    private StandupRecordMapper mapper;

    public List<StandupRecordDTO> findByMeetingId(String meetingId) {
        return repository.findByMeetingId(meetingId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<StandupRecordDTO> saveAll(List<StandupRecordDTO> dtos) {
        List<StandupRecord> entities = dtos.stream()
                .map(mapper::toEntity)
                .peek(entity -> {
                    if (entity.getCreatedAt() == null || entity.getCreatedAt().isEmpty()) {
                        entity.setCreatedAt(Instant.now().toString());
                    }
                })
                .collect(Collectors.toList());
        
        List<StandupRecord> saved = repository.saveAll(entities);
        return saved.stream().map(mapper::toDTO).collect(Collectors.toList());
    }
}
