package com.settribe.repository;

import com.settribe.entity.TaskStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskStatusHistoryRepository extends JpaRepository<TaskStatusHistory, Long> {
    List<TaskStatusHistory> findByTaskIdOrderByChangedAtDesc(Long taskId);
    List<TaskStatusHistory> findByChangedByUserIdOrderByChangedAtDesc(Long changedByUserId);
}
