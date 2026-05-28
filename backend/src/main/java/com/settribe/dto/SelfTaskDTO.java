package com.settribe.dto;

public class SelfTaskDTO {
    private String id;
    private String userId;
    private String title;
    private String description;
    private String priority;
    private String status;
    private String date;
    private String time;
    private Boolean reminder;
    private String reminderOffset;
    private String createdAt;

    public SelfTaskDTO() {}

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
