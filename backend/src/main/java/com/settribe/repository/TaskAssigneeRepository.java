package com.settribe.repository;

import com.settribe.entity.TaskAssignee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface TaskAssigneeRepository extends JpaRepository<TaskAssignee, Long> {
    List<TaskAssignee> findByTaskId(Long taskId);
    List<TaskAssignee> findByTaskIdAndStatus(Long taskId, String status);
    List<TaskAssignee> findByUserId(Long userId);
    List<TaskAssignee> findByUserIdAndStatus(Long userId, String status);

    @Query("SELECT t.taskId FROM TaskAssignee t WHERE t.userId = :userId")
    List<Long> findTaskIdsByUserId(@Param("userId") Long userId);
}
