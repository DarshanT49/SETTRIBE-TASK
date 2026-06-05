package com.settribe.dto;

import java.util.List;

public class TaskDTO {
    private Long id;
    private Long projectId;
    private String milestoneId;
    private String sprintId;
    private String title;
    private String description;
    private String priority;
    private Long creatorId;
    private Long assignedBy;
    private String status;
    private String startDate;
    private String dueDate;
    private String delayReason;
    private String newDueDate;
    private Boolean isDelayed;
    private String createdAt;
    private List<Long> assigneeIds;

    public TaskDTO() {}

    public TaskDTO(Long id, Long projectId, String milestoneId, String sprintId, String title, String description, String priority, Long creatorId, Long assignedBy, String status, String startDate, String dueDate, String delayReason, String newDueDate, Boolean isDelayed, String createdAt, List<Long> assigneeIds) {
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
        this.assigneeIds = assigneeIds;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
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

    public Long getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(Long creatorId) {
        this.creatorId = creatorId;
    }

    public Long getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(Long assignedBy) {
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

    public List<Long> getAssigneeIds() {
        return assigneeIds;
    }

    public void setAssigneeIds(List<Long> assigneeIds) {
        this.assigneeIds = assigneeIds;
    }
}
