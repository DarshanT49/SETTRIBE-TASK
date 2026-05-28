package com.settribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.Table;

@Entity
@Table(name = "taskhistorys")
public class TaskHistory {
    @Id
    private String id;
    @Column(columnDefinition = "TEXT")
    private String taskId;
    @Column(columnDefinition = "TEXT")
    private String projectId;
    @Column(columnDefinition = "TEXT")
    private String action;
    @Column(columnDefinition = "TEXT")
    private String performedBy;
    @Column(columnDefinition = "TEXT")
    private String fromStatus;
    @Column(columnDefinition = "TEXT")
    private String toStatus;
    @Column(columnDefinition = "TEXT")
    private String details;
    @Column(columnDefinition = "TEXT")
    private String timestamp;

    public TaskHistory() {
    }

    public TaskHistory(String id, String taskId, String projectId, String action, String performedBy, String fromStatus, String toStatus, String details, String timestamp) {
        this.id = id;
        this.taskId = taskId;
        this.projectId = projectId;
        this.action = action;
        this.performedBy = performedBy;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.details = details;
        this.timestamp = timestamp;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public String getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(String fromStatus) {
        this.fromStatus = fromStatus;
    }

    public String getToStatus() {
        return toStatus;
    }

    public void setToStatus(String toStatus) {
        this.toStatus = toStatus;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}



