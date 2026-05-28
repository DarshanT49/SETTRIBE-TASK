package com.settribe.service;

import com.settribe.entity.Sprint;
import com.settribe.repository.SprintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import com.settribe.dto.SprintDTO;
import com.settribe.mapper.SprintMapper;
import java.util.Optional;

@Service
public class SprintService {

    @Autowired
    private SprintRepository repository;

    public List<SprintDTO> findAll() {
        return repository.findAll().stream().map(SprintMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<SprintDTO> findById(String id) {
        return repository.findById(id).map(SprintMapper::toDTO);
    }

    public SprintDTO save(SprintDTO dto) {
        Sprint entity = SprintMapper.toEntity(dto);
        return SprintMapper.toDTO(repository.save(entity));
    }

    public SprintDTO update(String id, SprintDTO dto) {
        if(repository.existsById(id)) {
            Sprint entity = com.settribe.mapper.SprintMapper.toEntity(dto);
            entity.setId(id);
            return com.settribe.mapper.SprintMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }
}
