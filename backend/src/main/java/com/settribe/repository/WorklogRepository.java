package com.settribe.repository;

import com.settribe.entity.Worklog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorklogRepository extends JpaRepository<Worklog, String> {
    List<Worklog> findByUserId(String userId);
    List<Worklog> findByProjectId(String projectId);
    List<Worklog> findByTaskId(String taskId);
    List<Worklog> findByUserIdAndProjectId(String userId, String projectId);
    List<Worklog> findByUserIdAndTaskId(String userId, String taskId);
}
