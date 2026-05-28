package com.settribe.service;

import com.settribe.entity.Evaluation;
import com.settribe.repository.EvaluationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
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

    public EvaluationDTO save(EvaluationDTO dto) {
        Evaluation entity = EvaluationMapper.toEntity(dto);
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
