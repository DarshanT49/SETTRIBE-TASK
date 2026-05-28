package com.settribe.repository;

import com.settribe.entity.ProjectRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRequirementRepository extends JpaRepository<ProjectRequirement, String> {
}
