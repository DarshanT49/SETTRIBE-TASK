package com.settribe.service;

import com.settribe.entity.Project;
import com.settribe.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import com.settribe.dto.ProjectDTO;
import com.settribe.mapper.ProjectMapper;
import java.util.Optional;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository repository;

    public List<ProjectDTO> findAll() {
        return repository.findAll().stream().map(ProjectMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<ProjectDTO> findById(String id) {
        return repository.findById(id).map(ProjectMapper::toDTO);
    }

    public ProjectDTO save(ProjectDTO dto) {
        Project entity = ProjectMapper.toEntity(dto);
        return ProjectMapper.toDTO(repository.save(entity));
    }

    public ProjectDTO update(String id, ProjectDTO dto) {
        if(repository.existsById(id)) {
            Project entity = com.settribe.mapper.ProjectMapper.toEntity(dto);
            entity.setId(id);
            return com.settribe.mapper.ProjectMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }
}
