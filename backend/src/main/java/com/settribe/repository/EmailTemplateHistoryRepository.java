package com.settribe.repository;

import com.settribe.entity.EmailTemplateHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailTemplateHistoryRepository extends JpaRepository<EmailTemplateHistory, String> {
    List<EmailTemplateHistory> findByTemplateIdOrderByVersionDesc(String templateId);
}
