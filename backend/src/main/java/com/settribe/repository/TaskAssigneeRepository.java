package com.settribe.repository;

import com.settribe.entity.TaskAssignee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskAssigneeRepository extends JpaRepository<TaskAssignee, Long> {
    List<TaskAssignee> findByTaskId(Long taskId);
    List<TaskAssignee> findByTaskIdAndStatus(Long taskId, String status);
    List<TaskAssignee> findByUserId(Long userId);
    List<TaskAssignee> findByUserIdAndStatus(Long userId, String status);
}
