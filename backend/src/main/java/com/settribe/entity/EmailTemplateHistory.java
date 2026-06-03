package com.settribe.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "email_template_history")
public class EmailTemplateHistory {
    @Id
    private String id;
    private String templateId;
    private String name;
    private String category;
    private String subject;
    
    @Column(columnDefinition = "TEXT")
    private String htmlBody;
    
    private Integer version;
    private String modifiedBy;
    private String modifiedAt;

    public EmailTemplateHistory() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTemplateId() { return templateId; }
    public void setTemplateId(String templateId) { this.templateId = templateId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getHtmlBody() { return htmlBody; }
    public void setHtmlBody(String htmlBody) { this.htmlBody = htmlBody; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public String getModifiedBy() { return modifiedBy; }
    public void setModifiedBy(String modifiedBy) { this.modifiedBy = modifiedBy; }
    public String getModifiedAt() { return modifiedAt; }
    public void setModifiedAt(String modifiedAt) { this.modifiedAt = modifiedAt; }
}
