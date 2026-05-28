package com.settribe.service;

import com.settribe.entity.ProjectRequirement;
import com.settribe.repository.ProjectRequirementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import com.settribe.dto.ProjectRequirementDTO;
import com.settribe.mapper.ProjectRequirementMapper;
import java.util.Optional;

@Service
public class ProjectRequirementService {

    @Autowired
    private ProjectRequirementRepository repository;

    public List<ProjectRequirementDTO> findAll() {
        return repository.findAll().stream().map(ProjectRequirementMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<ProjectRequirementDTO> findById(String id) {
        return repository.findById(id).map(ProjectRequirementMapper::toDTO);
    }

    public ProjectRequirementDTO save(ProjectRequirementDTO dto) {
        ProjectRequirement entity = ProjectRequirementMapper.toEntity(dto);
        return ProjectRequirementMapper.toDTO(repository.save(entity));
    }

    public ProjectRequirementDTO update(String id, ProjectRequirementDTO dto) {
        if(repository.existsById(id)) {
            ProjectRequirement entity = com.settribe.mapper.ProjectRequirementMapper.toEntity(dto);
            entity.setId(id);
            return com.settribe.mapper.ProjectRequirementMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }
}
