package com.settribe.service;

import com.settribe.entity.TaskHistory;
import com.settribe.repository.TaskHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import com.settribe.dto.TaskHistoryDTO;
import com.settribe.mapper.TaskHistoryMapper;
import java.util.Optional;

@Service
public class TaskHistoryService {

    @Autowired
    private TaskHistoryRepository repository;

    public List<TaskHistoryDTO> findAll() {
        return repository.findAll().stream().map(TaskHistoryMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<TaskHistoryDTO> findById(String id) {
        return repository.findById(id).map(TaskHistoryMapper::toDTO);
    }

    public TaskHistoryDTO save(TaskHistoryDTO dto) {
        TaskHistory entity = TaskHistoryMapper.toEntity(dto);
        return TaskHistoryMapper.toDTO(repository.save(entity));
    }

    public TaskHistoryDTO update(String id, TaskHistoryDTO dto) {
        if(repository.existsById(id)) {
            TaskHistory entity = com.settribe.mapper.TaskHistoryMapper.toEntity(dto);
            entity.setId(id);
            return com.settribe.mapper.TaskHistoryMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }
}
