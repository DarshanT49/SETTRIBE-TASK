package com.settribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Table;

@Entity
@Table(name = "self_tasks")
public class SelfTask {
    @Id
    private String id;
    @Column(columnDefinition = "TEXT")
    private String userId;
    @Column(columnDefinition = "TEXT")
    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(columnDefinition = "TEXT")
    private String priority;
    @Column(columnDefinition = "TEXT")
    private String status;
    @Column(columnDefinition = "TEXT")
    private String date;
    @Column(columnDefinition = "TEXT")
    private String time;
    private Boolean reminder;
    @Column(columnDefinition = "TEXT")
    private String reminderOffset;
    @Column(columnDefinition = "TEXT")
    private String createdAt;

    public SelfTask() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public Boolean getReminder() { return reminder; }
    public void setReminder(Boolean reminder) { this.reminder = reminder; }
    public String getReminderOffset() { return reminderOffset; }
    public void setReminderOffset(String reminderOffset) { this.reminderOffset = reminderOffset; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
