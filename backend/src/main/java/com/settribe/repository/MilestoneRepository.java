package com.settribe.repository;

import com.settribe.entity.Milestone;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, String> {
    List<Milestone> findByProjectId(String projectId);
    long countByStatus(String status);
    List<Milestone> findByStatus(String status);
}
