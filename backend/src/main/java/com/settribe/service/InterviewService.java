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

    public InterviewDTO startInterview(String id) {
        Interview interview = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview not found"));
        interview.setJoinStatus("READY");
        interview.setStatus("in_progress");
        return InterviewMapper.toDTO(repository.save(interview));
    }

    public InterviewDTO endInterview(String id) {
        Interview interview = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview not found"));
        interview.setJoinStatus("COMPLETED");
        interview.setStatus("completed");
        return InterviewMapper.toDTO(repository.save(interview));
    }

    public InterviewDTO validateToken(String token) {
        Interview interview = repository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        long currentMillis = System.currentTimeMillis();
        boolean hasDateAndTime = interview.getDate() != null && !interview.getDate().isEmpty() &&
                                 interview.getTime() != null && !interview.getTime().isEmpty();

        try {
            if (hasDateAndTime) {
                java.time.LocalDateTime startDateTime = java.time.LocalDateTime.parse(interview.getDate() + "T" + interview.getTime());
                long startMillis = startDateTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();
                
                int durationMinutes = 60; // default
                if (interview.getDuration() != null && !interview.getDuration().isEmpty()) {
                    try {
                        durationMinutes = Integer.parseInt(interview.getDuration());
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }
                
                long endMillis = startMillis + (durationMinutes * 60 * 1000L);
                
                if (currentMillis > endMillis) {
                    interview.setJoinStatus("EXPIRED");
                    repository.save(interview);
                    throw new RuntimeException("Interview session has expired based on scheduled time");
                }
                
                // Allow joining up to 5 minutes early, else put in waiting room
                if (currentMillis < startMillis - (5 * 60 * 1000L)) {
                    InterviewDTO dto = InterviewMapper.toDTO(interview);
                    dto.setJoinStatus("WAITING_ROOM");
                    return dto;
                }
                
            } else if (interview.getExpiryTimestamp() != null) {
                // Fallback to old logic if date/time are missing
                long expiry = Long.parseLong(interview.getExpiryTimestamp());
                if (currentMillis > expiry) {
                    interview.setJoinStatus("EXPIRED");
                    repository.save(interview);
                    throw new RuntimeException("Interview session has expired");
                }
            }
        } catch (Exception e) {
            if (e instanceof RuntimeException && e.getMessage().contains("expired")) {
                throw e; // rethrow expiration exception
            }
            // Fallback for parsing errors
            if (interview.getExpiryTimestamp() != null) {
                try {
                    long expiry = Long.parseLong(interview.getExpiryTimestamp());
                    if (currentMillis > expiry) {
                        interview.setJoinStatus("EXPIRED");
                        repository.save(interview);
                        throw new RuntimeException("Interview session has expired");
                    }
                } catch (NumberFormatException nfe) {}
            }
        }
        
        return InterviewMapper.toDTO(interview);
    }
}
