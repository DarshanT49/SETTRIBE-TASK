package com.settribe.service;

import com.settribe.entity.Milestone;
import com.settribe.repository.MilestoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import com.settribe.dto.MilestoneDTO;
import com.settribe.mapper.MilestoneMapper;
import java.util.Optional;

@Service
public class MilestoneService {

    @Autowired
    private MilestoneRepository repository;

    public List<MilestoneDTO> findAll() {
        return repository.findAll().stream().map(MilestoneMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<MilestoneDTO> findById(String id) {
        return repository.findById(id).map(MilestoneMapper::toDTO);
    }

    public MilestoneDTO save(MilestoneDTO dto) {
        Milestone entity = MilestoneMapper.toEntity(dto);
        return MilestoneMapper.toDTO(repository.save(entity));
    }

    public MilestoneDTO update(String id, MilestoneDTO dto) {
        if(repository.existsById(id)) {
            Milestone entity = com.settribe.mapper.MilestoneMapper.toEntity(dto);
            entity.setId(id);
            return com.settribe.mapper.MilestoneMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }
}
