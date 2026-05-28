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

    public List<InterviewDTO> findAll() {
        return repository.findAll().stream().map(InterviewMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<InterviewDTO> findById(String id) {
        return repository.findById(id).map(InterviewMapper::toDTO);
    }

    public InterviewDTO save(InterviewDTO dto) {
        Interview entity = InterviewMapper.toEntity(dto);
        return InterviewMapper.toDTO(repository.save(entity));
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
}
