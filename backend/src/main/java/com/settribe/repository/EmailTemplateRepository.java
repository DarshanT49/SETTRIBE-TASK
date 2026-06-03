package com.settribe.repository;

import com.settribe.entity.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, String> {
    List<EmailTemplate> findByCategory(String category);
    Optional<EmailTemplate> findByCategoryAndIsDefaultTrueAndIsActiveTrue(String category);
}
