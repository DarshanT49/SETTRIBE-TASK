package com.settribe.dto;

import java.util.List;

public class ProjectDTO {
    private String id;
    private String title;
    private String description;
    private String clientName;
    private String category;
    private String priority;
    private String status;
    private String ownerId;
    private String managerId;
    private String startDate;
    private String endDate;
    private String deadline;
    private String repoLink;
    private Integer progress;
    private String createdAt;
    private List<String> teamIds;

    public ProjectDTO() {}

    public ProjectDTO(String id, String title, String description, String clientName, String category, String priority, String status, String ownerId, String managerId, String startDate, String endDate, String deadline, String repoLink, Integer progress, String createdAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.clientName = clientName;
        this.category = category;
        this.priority = priority;
        this.status = status;
        this.ownerId = ownerId;
        this.managerId = managerId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.deadline = deadline;
        this.repoLink = repoLink;
        this.progress = progress;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }

    public String getManagerId() {
        return managerId;
    }

    public void setManagerId(String managerId) {
        this.managerId = managerId;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public String getDeadline() {
        return deadline;
    }

    public void setDeadline(String deadline) {
        this.deadline = deadline;
    }

    public String getRepoLink() {
        return repoLink;
    }

    public void setRepoLink(String repoLink) {
        this.repoLink = repoLink;
    }

    public Integer getProgress() {
        return progress;
    }

    public void setProgress(Integer progress) {
        this.progress = progress;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public List<String> getTeamIds() {
        return teamIds;
    }

    public void setTeamIds(List<String> teamIds) {
        this.teamIds = teamIds;
    }
}
