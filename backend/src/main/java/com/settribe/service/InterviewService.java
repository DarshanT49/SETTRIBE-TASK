package com.settribe.service;

import com.settribe.entity.Interview;
import com.settribe.repository.InterviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import com.settribe.dto.InterviewDTO;
import com.settribe.mapper.InterviewMapper;
import java.util.Optional;

@Service
public class InterviewService {

    @Autowired
    private InterviewRepository repository;

    @Autowired
    private EmailService emailService;

    public List<InterviewDTO> findAll() {
        return repository.findAll().stream().map(InterviewMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<InterviewDTO> findById(String id) {
        return repository.findById(id).map(InterviewMapper::toDTO);
    }

    public InterviewDTO save(InterviewDTO dto) {
        Interview entity = InterviewMapper.toEntity(dto);
        Interview saved = repository.save(entity);
        InterviewDTO savedDto = InterviewMapper.toDTO(saved);
        
        // Send email invitation if scheduled
        if ("scheduled".equalsIgnoreCase(savedDto.getStatus())) {
            emailService.sendInterviewInvitation(savedDto);
        }
        
        return savedDto;
    }

    public InterviewDTO update(String id, InterviewDTO dto) {
        if(repository.existsById(id)) {
            Interview entity = com.settribe.mapper.InterviewMapper.toEntity(dto);
            entity.setId(id);
            return com.settribe.mapper.InterviewMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }

    public Optional<InterviewDTO> findByToken(String token) {
        return repository.findByToken(token).map(InterviewMapper::toDTO);
    }

    public InterviewDTO validateToken(String token) {
        Interview interview = repository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (interview.getExpiryTimestamp() != null) {
            long expiry = Long.parseLong(interview.getExpiryTimestamp());
            if (System.currentTimeMillis() > expiry) {
                interview.setJoinStatus("EXPIRED");
                repository.save(interview);
                throw new RuntimeException("Interview session has expired");
            }
            
            // Allow joining up to 5 minutes early, else put in waiting room
            try {
                if (interview.getDate() != null && interview.getTime() != null) {
                    java.time.LocalDateTime startDateTime = java.time.LocalDateTime.parse(interview.getDate() + "T" + interview.getTime());
                    long startMillis = startDateTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();
                    if (System.currentTimeMillis() < startMillis - (5 * 60 * 1000)) {
                        InterviewDTO dto = InterviewMapper.toDTO(interview);
                        dto.setJoinStatus("WAITING_ROOM");
                        return dto;
                    }
                }
            } catch (Exception e) {}
        }
        
        return InterviewMapper.toDTO(interview);
    }
}
