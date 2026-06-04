package com.settribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "task_assignees")
public class TaskAssignee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long taskId;
    private Long userId;
    private String status;
    private String assignedAt;
    private String unassignedAt;

    public TaskAssignee() {
    }

    public TaskAssignee(Long taskId, Long userId, String status, String assignedAt, String unassignedAt) {
        this.taskId = taskId;
        this.userId = userId;
        this.status = status;
        this.assignedAt = assignedAt;
        this.unassignedAt = unassignedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTaskId() {
        return taskId;
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(String assignedAt) {
        this.assignedAt = assignedAt;
    }

    public String getUnassignedAt() {
        return unassignedAt;
    }

    public void setUnassignedAt(String unassignedAt) {
        this.unassignedAt = unassignedAt;
    }
}
