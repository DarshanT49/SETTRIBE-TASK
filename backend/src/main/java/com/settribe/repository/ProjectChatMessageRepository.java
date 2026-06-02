package com.settribe.repository;

import com.settribe.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import com.settribe.entity.ProjectChatMessage;

@Repository
public interface ProjectChatMessageRepository extends JpaRepository<ProjectChatMessage, String> {
    List<ProjectChatMessage> findByProjectIdOrderByCreatedAtAsc(String projectId);
}
