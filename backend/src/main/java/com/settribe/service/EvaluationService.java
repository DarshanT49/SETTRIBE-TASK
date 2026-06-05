package com.settribe.service;

import com.settribe.entity.Evaluation;
import com.settribe.repository.EvaluationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import com.settribe.dto.EvaluationDTO;
import com.settribe.mapper.EvaluationMapper;

@Service
public class EvaluationService {
    @Autowired
    private EvaluationRepository repository;

    public List<EvaluationDTO> findAll() {
        return repository.findAll().stream().map(EvaluationMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<EvaluationDTO> findById(String id) {
        return repository.findById(id).map(EvaluationMapper::toDTO);
    }

    /** Look up an evaluation by the interview it belongs to */
    public Optional<EvaluationDTO> findByInterviewId(String interviewId) {
        return repository.findByInterviewId(interviewId).map(EvaluationMapper::toDTO);
    }

    public EvaluationDTO save(EvaluationDTO dto) {
        Evaluation entity = EvaluationMapper.toEntity(dto);
        // Auto-generate id if not supplied by the client
        if (entity.getId() == null || entity.getId().isBlank()) {
            entity.setId(UUID.randomUUID().toString());
        }
        // Stamp creation time if missing
        if (entity.getCreatedAt() == null || entity.getCreatedAt().isBlank()) {
            entity.setCreatedAt(Instant.now().toString());
        }
        return EvaluationMapper.toDTO(repository.save(entity));
    }

    public EvaluationDTO update(String id, EvaluationDTO dto) {
        if (repository.existsById(id)) {
            Evaluation entity = EvaluationMapper.toEntity(dto);
            entity.setId(id);
            return EvaluationMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }
}
