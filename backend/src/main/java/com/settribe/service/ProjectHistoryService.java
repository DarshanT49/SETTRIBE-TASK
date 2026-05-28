package com.settribe.service;

import com.settribe.entity.ProjectHistory;
import com.settribe.repository.ProjectHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import com.settribe.dto.ProjectHistoryDTO;
import com.settribe.mapper.ProjectHistoryMapper;
import java.util.Optional;

@Service
public class ProjectHistoryService {

    @Autowired
    private ProjectHistoryRepository repository;

    public List<ProjectHistoryDTO> findAll() {
        return repository.findAll().stream().map(ProjectHistoryMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<ProjectHistoryDTO> findById(String id) {
        return repository.findById(id).map(ProjectHistoryMapper::toDTO);
    }

    public ProjectHistoryDTO save(ProjectHistoryDTO dto) {
        ProjectHistory entity = ProjectHistoryMapper.toEntity(dto);
        return ProjectHistoryMapper.toDTO(repository.save(entity));
    }

    public ProjectHistoryDTO update(String id, ProjectHistoryDTO dto) {
        if(repository.existsById(id)) {
            ProjectHistory entity = com.settribe.mapper.ProjectHistoryMapper.toEntity(dto);
            entity.setId(id);
            return com.settribe.mapper.ProjectHistoryMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }
}
