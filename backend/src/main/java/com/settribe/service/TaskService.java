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

    @Autowired
    private com.settribe.repository.TaskAssigneeRepository assigneeRepository;

    @Autowired
    private com.settribe.repository.TaskStatusHistoryRepository historyRepository;

    public List<com.settribe.entity.TaskAssignee> getAssignees(Long taskId) {
        return assigneeRepository.findByTaskId(taskId);
    }

    public com.settribe.entity.TaskAssignee addAssignee(Long taskId, Long userId) {
        com.settribe.entity.TaskAssignee assignee = new com.settribe.entity.TaskAssignee(taskId, userId, "ACTIVE", java.time.Instant.now().toString(), null);
        return assigneeRepository.save(assignee);
    }

    public List<TaskDTO> findAll() {
        List<Task> tasks = repository.findAll();
        List<com.settribe.entity.TaskAssignee> assignees = assigneeRepository.findAll();
        
        java.util.Map<Long, List<Long>> taskToAssigneeIds = assignees.stream()
            .filter(a -> "ACTIVE".equals(a.getStatus())) // Optional: filter by active status if needed
            .collect(Collectors.groupingBy(
                com.settribe.entity.TaskAssignee::getTaskId,
                Collectors.mapping(com.settribe.entity.TaskAssignee::getUserId, Collectors.toList())
            ));

        return tasks.stream().map(task -> {
            TaskDTO dto = TaskMapper.toDTO(task);
            dto.setAssigneeIds(taskToAssigneeIds.getOrDefault(task.getId(), java.util.Collections.emptyList()));
            return dto;
        }).collect(Collectors.toList());
    }

    public Optional<TaskDTO> findById(Long id) {
        return repository.findById(id).map(task -> {
            TaskDTO dto = TaskMapper.toDTO(task);
            List<Long> assigneeIds = getAssignees(id).stream()
                .filter(a -> "ACTIVE".equals(a.getStatus()))
                .map(com.settribe.entity.TaskAssignee::getUserId)
                .collect(Collectors.toList());
            dto.setAssigneeIds(assigneeIds);
            return dto;
        });
    }

    public TaskDTO save(TaskDTO dto) {
        Task entity = TaskMapper.toEntity(dto);
        return TaskMapper.toDTO(repository.save(entity));
    }

    public TaskDTO update(Long id, TaskDTO dto) {
        if(repository.existsById(id)) {
            Task oldTask = repository.findById(id).get();
            if (oldTask.getStatus() != null && !oldTask.getStatus().equals(dto.getStatus())) {
                historyRepository.save(new com.settribe.entity.TaskStatusHistory(id, oldTask.getStatus(), dto.getStatus(), dto.getAssignedBy(), java.time.Instant.now().toString()));
            }
            Task entity = com.settribe.mapper.TaskMapper.toEntity(dto);
            entity.setId(id);
            return com.settribe.mapper.TaskMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public List<com.settribe.entity.TaskStatusHistory> getHistory(Long taskId) {
        return historyRepository.findByTaskIdOrderByChangedAtDesc(taskId);
    }
}
