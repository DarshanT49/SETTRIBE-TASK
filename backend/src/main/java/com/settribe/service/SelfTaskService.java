package com.settribe.service;

import com.settribe.entity.SelfTask;
import com.settribe.repository.SelfTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.settribe.dto.SelfTaskDTO;
import com.settribe.mapper.SelfTaskMapper;

@Service
public class SelfTaskService {
    @Autowired
    private SelfTaskRepository repository;

    public List<SelfTaskDTO> findAll() {
        return repository.findAll().stream().map(SelfTaskMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<SelfTaskDTO> findById(String id) {
        return repository.findById(id).map(SelfTaskMapper::toDTO);
    }

    public SelfTaskDTO save(SelfTaskDTO dto) {
        SelfTask entity = SelfTaskMapper.toEntity(dto);
        return SelfTaskMapper.toDTO(repository.save(entity));
    }

    public SelfTaskDTO update(String id, SelfTaskDTO dto) {
        if (repository.existsById(id)) {
            SelfTask entity = SelfTaskMapper.toEntity(dto);
            entity.setId(id);
            return SelfTaskMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }
}
