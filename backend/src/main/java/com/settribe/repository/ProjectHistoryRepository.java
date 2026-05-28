package com.settribe.repository;

import com.settribe.entity.ProjectHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectHistoryRepository extends JpaRepository<ProjectHistory, String> {
}
