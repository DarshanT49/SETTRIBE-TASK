package com.settribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.Table;

@Entity
@Table(name = "tasks")
public class Task {
    @Id
    private String id;
    @Column(columnDefinition = "TEXT")
    private String projectId;
    @Column(columnDefinition = "TEXT")
    private String milestoneId;
    @Column(columnDefinition = "TEXT")
    private String sprintId;
    @Column(columnDefinition = "TEXT")
    private String title;
    @Column(length = 1000)
    private String description;
    @Column(columnDefinition = "TEXT")
    private String priority;
    @Column(columnDefinition = "TEXT")
    private String creatorId;
    @Column(columnDefinition = "TEXT")
    private String assignedBy;
    @Column(columnDefinition = "TEXT")
    private String status;
    @Column(columnDefinition = "TEXT")
    private String startDate;
    @Column(columnDefinition = "TEXT")
    private String dueDate;
    @Column(columnDefinition = "TEXT")
    private String delayReason;
    @Column(columnDefinition = "TEXT")
    private String newDueDate;
    private Boolean isDelayed;
    @Column(columnDefinition = "TEXT")
    private String createdAt;
    @Column(columnDefinition = "TEXT")
    private String assigneeIds; // stored as JSON array string

    public Task() {
    }

    public Task(String id, String projectId, String milestoneId, String sprintId, String title, String description, String priority, String creatorId, String assignedBy, String status, String startDate, String dueDate, String delayReason, String newDueDate, Boolean isDelayed, String createdAt) {
        this.id = id;
        this.projectId = projectId;
        this.milestoneId = milestoneId;
        this.sprintId = sprintId;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.creatorId = creatorId;
        this.assignedBy = assignedBy;
        this.status = status;
        this.startDate = startDate;
        this.dueDate = dueDate;
        this.delayReason = delayReason;
        this.newDueDate = newDueDate;
        this.isDelayed = isDelayed;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getMilestoneId() {
        return milestoneId;
    }

    public void setMilestoneId(String milestoneId) {
        this.milestoneId = milestoneId;
    }

    public String getSprintId() {
        return sprintId;
    }

    public void setSprintId(String sprintId) {
        this.sprintId = sprintId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(String creatorId) {
        this.creatorId = creatorId;
    }

    public String getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(String assignedBy) {
        this.assignedBy = assignedBy;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public String getDelayReason() {
        return delayReason;
    }

    public void setDelayReason(String delayReason) {
        this.delayReason = delayReason;
    }

    public String getNewDueDate() {
        return newDueDate;
    }

    public void setNewDueDate(String newDueDate) {
        this.newDueDate = newDueDate;
    }

    public Boolean getIsDelayed() {
        return isDelayed;
    }

    public void setIsDelayed(Boolean isDelayed) {
        this.isDelayed = isDelayed;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getAssigneeIds() {
        return assigneeIds;
    }

    public void setAssigneeIds(String assigneeIds) {
        this.assigneeIds = assigneeIds;
    }
}



