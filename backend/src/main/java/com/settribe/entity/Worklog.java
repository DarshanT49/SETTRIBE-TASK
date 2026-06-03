package com.settribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;

@Entity
@Table(name = "worklogs")
public class Worklog {
    @Id
    private String id;
    
    @Column(columnDefinition = "TEXT")
    private String userId;
    
    @Column(columnDefinition = "TEXT")
    private String taskId;
    
    @Column(columnDefinition = "TEXT")
    private String projectId;
    
    private Double loggedHours;
    
    @Column(columnDefinition = "TEXT")
    private String date; // Format: YYYY-MM-DD
    
    @Column(length = 1000)
    private String description;
    
    @Column(columnDefinition = "TEXT")
    private String taskCategory;
    
    @Column(columnDefinition = "TEXT")
    private String createdAt;

    public Worklog() {
    }

    public Worklog(String id, String userId, String taskId, String projectId, Double loggedHours, String date, String description, String taskCategory, String createdAt) {
        this.id = id;
        this.userId = userId;
        this.taskId = taskId;
        this.projectId = projectId;
        this.loggedHours = loggedHours;
        this.date = date;
        this.description = description;
        this.taskCategory = taskCategory;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public Double getLoggedHours() {
        return loggedHours;
    }

    public void setLoggedHours(Double loggedHours) {
        this.loggedHours = loggedHours;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTaskCategory() {
        return taskCategory;
    }

    public void setTaskCategory(String taskCategory) {
        this.taskCategory = taskCategory;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
