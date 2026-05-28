package com.settribe.dto;

public class ProjectHistoryDTO {
    private String id;
    private String projectId;
    private String action;
    private String performedBy;
    private String targetId;
    private String targetType;
    private String details;
    private String timestamp;

    public ProjectHistoryDTO() {}

    public ProjectHistoryDTO(String id, String projectId, String action, String performedBy, String targetId, String targetType, String details, String timestamp) {
        this.id = id;
        this.projectId = projectId;
        this.action = action;
        this.performedBy = performedBy;
        this.targetId = targetId;
        this.targetType = targetType;
        this.details = details;
        this.timestamp = timestamp;
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

    public String getTargetId() {
        return targetId;
    }

    public void setTargetId(String targetId) {
        this.targetId = targetId;
    }

    public String getTargetType() {
        return targetType;
    }

    public void setTargetType(String targetType) {
        this.targetType = targetType;
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
