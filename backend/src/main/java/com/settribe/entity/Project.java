package com.settribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.Table;

@Entity
@Table(name = "projects", indexes = {
    @jakarta.persistence.Index(name = "idx_projects_status", columnList = "status"),
    @jakarta.persistence.Index(name = "idx_projects_owner_id", columnList = "ownerId"),
    @jakarta.persistence.Index(name = "idx_projects_manager_id", columnList = "managerId")
})
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(columnDefinition = "TEXT")
    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(columnDefinition = "TEXT")
    private String clientName;
    @Column(columnDefinition = "TEXT")
    private String category;
    @Column(columnDefinition = "TEXT")
    private String priority;
    @Column(columnDefinition = "TEXT")
    private String status;
    private Long ownerId;
    private Long managerId;
    @Column(columnDefinition = "TEXT")
    private String startDate;
    @Column(columnDefinition = "TEXT")
    private String endDate;
    @Column(columnDefinition = "TEXT")
    private String deadline;
    @Column(columnDefinition = "TEXT")
    private String repoLink;
    private Integer progress;
    @Column(columnDefinition = "TEXT")
    private String createdAt;

    public Project() {
    }

    public Project(Long id, String title, String description, String clientName, String category, String priority, String status, Long ownerId, Long managerId, String startDate, String endDate, String deadline, String repoLink, Integer progress, String createdAt) {
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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
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

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public Long getManagerId() {
        return managerId;
    }

    public void setManagerId(Long managerId) {
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
}



