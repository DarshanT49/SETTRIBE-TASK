package com.settribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Table;

@Entity
@Table(name = "chat_messages")
public class ProjectChatMessage {
    @Id
    private String id;
    
    @Column(columnDefinition = "TEXT")
    private String projectId;
    
    @Column(columnDefinition = "TEXT")
    private String senderId;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    @Column(columnDefinition = "TEXT")
    private String messageType; // TEXT, IMAGE, FILE, SYSTEM
    
    @Column(columnDefinition = "TEXT")
    private String metadata; // JSON representation for mentions, replies, file content
    
    @Column(columnDefinition = "TEXT")
    private String readBy; // JSON array of user IDs who have seen it
    
    @Column(columnDefinition = "TEXT")
    private String createdAt;

    public ProjectChatMessage() {
    }

    public ProjectChatMessage(String id, String projectId, String senderId, String content, String messageType, String metadata, String readBy, String createdAt) {
        this.id = id;
        this.projectId = projectId;
        this.senderId = senderId;
        this.content = content;
        this.messageType = messageType;
        this.metadata = metadata;
        this.readBy = readBy;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }
    
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
    
    public String getReadBy() { return readBy; }
    public void setReadBy(String readBy) { this.readBy = readBy; }
    
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
