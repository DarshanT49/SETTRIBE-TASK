package com.settribe.service;

import com.settribe.entity.Task;
import com.settribe.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import com.settribe.dto.TaskDTO;
import com.settribe.mapper.TaskMapper;
import java.util.Optional;

@Service
public class TaskService {

    @Autowired
    private TaskRepository repository;

    public List<TaskDTO> findAll() {
        return repository.findAll().stream().map(TaskMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<TaskDTO> findById(String id) {
        return repository.findById(id).map(TaskMapper::toDTO);
    }

    public TaskDTO save(TaskDTO dto) {
        Task entity = TaskMapper.toEntity(dto);
        return TaskMapper.toDTO(repository.save(entity));
    }

    public TaskDTO update(String id, TaskDTO dto) {
        if(repository.existsById(id)) {
            Task entity = com.settribe.mapper.TaskMapper.toEntity(dto);
            entity.setId(id);
            return com.settribe.mapper.TaskMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }
}
