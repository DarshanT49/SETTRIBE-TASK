package com.settribe.controller;

import com.settribe.entity.EmailTemplate;
import com.settribe.entity.EmailTemplateHistory;
import com.settribe.service.EmailTemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emailTemplates")
@CrossOrigin(origins = "http://localhost:5173")
public class EmailTemplateController {

    @Autowired
    private EmailTemplateService emailTemplateService;

    @GetMapping
    public List<EmailTemplate> getAllTemplates() {
        return emailTemplateService.getAllTemplates();
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmailTemplate> getTemplateById(@PathVariable String id) {
        EmailTemplate template = emailTemplateService.getTemplateById(id);
        return template != null ? ResponseEntity.ok(template) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public EmailTemplate createTemplate(@RequestBody EmailTemplate template) {
        return emailTemplateService.createTemplate(template);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmailTemplate> updateTemplate(@PathVariable String id, @RequestBody EmailTemplate template) {
        EmailTemplate updated = emailTemplateService.updateTemplate(id, template);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable String id) {
        emailTemplateService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/history")
    public List<EmailTemplateHistory> getTemplateHistory(@PathVariable String id) {
        return emailTemplateService.getTemplateHistory(id);
    }

    @PostMapping("/{id}/restore/{historyId}")
    public ResponseEntity<EmailTemplate> restoreVersion(@PathVariable String id, @PathVariable String historyId) {
        EmailTemplate restored = emailTemplateService.restoreVersion(id, historyId);
        return restored != null ? ResponseEntity.ok(restored) : ResponseEntity.badRequest().build();
    }
}
