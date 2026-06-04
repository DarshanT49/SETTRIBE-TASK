package com.settribe.repository;

import com.settribe.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    List<ProjectMember> findByProjectId(Long projectId);
    List<ProjectMember> findByProjectIdAndStatus(Long projectId, String status);
    List<ProjectMember> findByUserId(Long userId);
    List<ProjectMember> findByUserIdAndStatus(Long userId, String status);
    java.util.Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);
}
