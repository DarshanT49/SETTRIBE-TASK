package com.settribe.service;

import com.settribe.entity.EmailTemplate;
import com.settribe.entity.EmailTemplateHistory;
import com.settribe.repository.EmailTemplateHistoryRepository;
import com.settribe.repository.EmailTemplateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class EmailTemplateService {

    @Autowired
    private EmailTemplateRepository templateRepository;

    @Autowired
    private EmailTemplateHistoryRepository historyRepository;

    public List<EmailTemplate> getAllTemplates() {
        return templateRepository.findAll();
    }

    public EmailTemplate getTemplateById(String id) {
        return templateRepository.findById(id).orElse(null);
    }

    public List<EmailTemplate> getTemplatesByCategory(String category) {
        return templateRepository.findByCategory(category);
    }
    
    public EmailTemplate getActiveTemplateByCategory(String category) {
        return templateRepository.findByCategoryAndIsDefaultTrueAndIsActiveTrue(category).orElse(null);
    }

    public EmailTemplate createTemplate(EmailTemplate template) {
        if (template.getId() == null) {
            template.setId(UUID.randomUUID().toString());
        }
        if (template.getVersion() == null) {
            template.setVersion(1);
        }
        if (template.getCreatedAt() == null) {
            template.setCreatedAt(Instant.now().toString());
        }
        template.setUpdatedAt(template.getCreatedAt());
        
        EmailTemplate saved = templateRepository.save(template);
        saveHistory(saved);
        return saved;
    }

    public EmailTemplate updateTemplate(String id, EmailTemplate templateUpdates) {
        Optional<EmailTemplate> existingOpt = templateRepository.findById(id);
        if (existingOpt.isPresent()) {
            EmailTemplate existing = existingOpt.get();
            existing.setName(templateUpdates.getName());
            existing.setSubject(templateUpdates.getSubject());
            existing.setHtmlBody(templateUpdates.getHtmlBody());
            existing.setIsDefault(templateUpdates.getIsDefault());
            existing.setIsActive(templateUpdates.getIsActive());
            existing.setVersion(existing.getVersion() + 1);
            existing.setUpdatedBy(templateUpdates.getUpdatedBy());
            existing.setUpdatedAt(Instant.now().toString());
            
            // If setting to default, unset others in category
            if (Boolean.TRUE.equals(templateUpdates.getIsDefault())) {
                List<EmailTemplate> others = templateRepository.findByCategory(existing.getCategory());
                for (EmailTemplate other : others) {
                    if (!other.getId().equals(existing.getId()) && Boolean.TRUE.equals(other.getIsDefault())) {
                        other.setIsDefault(false);
                        templateRepository.save(other);
                    }
                }
            }

            EmailTemplate saved = templateRepository.save(existing);
            saveHistory(saved);
            return saved;
        }
        return null;
    }

    public void deleteTemplate(String id) {
        templateRepository.deleteById(id);
    }

    public List<EmailTemplateHistory> getTemplateHistory(String templateId) {
        return historyRepository.findByTemplateIdOrderByVersionDesc(templateId);
    }
    
    public EmailTemplate restoreVersion(String templateId, String historyId) {
        Optional<EmailTemplateHistory> historyOpt = historyRepository.findById(historyId);
        Optional<EmailTemplate> templateOpt = templateRepository.findById(templateId);
        
        if (historyOpt.isPresent() && templateOpt.isPresent()) {
            EmailTemplateHistory history = historyOpt.get();
            EmailTemplate template = templateOpt.get();
            
            template.setName(history.getName());
            template.setSubject(history.getSubject());
            template.setHtmlBody(history.getHtmlBody());
            template.setVersion(template.getVersion() + 1);
            template.setUpdatedAt(Instant.now().toString());
            
            EmailTemplate saved = templateRepository.save(template);
            saveHistory(saved);
            return saved;
        }
        return null;
    }

    private void saveHistory(EmailTemplate template) {
        EmailTemplateHistory history = new EmailTemplateHistory();
        history.setId(UUID.randomUUID().toString());
        history.setTemplateId(template.getId());
        history.setName(template.getName());
        history.setCategory(template.getCategory());
        history.setSubject(template.getSubject());
        history.setHtmlBody(template.getHtmlBody());
        history.setVersion(template.getVersion());
        history.setModifiedBy(template.getUpdatedBy() != null ? template.getUpdatedBy() : template.getCreatedBy());
        history.setModifiedAt(template.getUpdatedAt());
        historyRepository.save(history);
    }
}
