package com.settribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "project_members")
public class ProjectMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long projectId;
    private Long userId;
    private Boolean isLead;
    private String status;
    private String joinedAt;
    private String leftAt;

    public ProjectMember() {
    }

    public ProjectMember(Long projectId, Long userId, Boolean isLead, String status, String joinedAt, String leftAt) {
        this.projectId = projectId;
        this.userId = userId;
        this.isLead = isLead;
        this.status = status;
        this.joinedAt = joinedAt;
        this.leftAt = leftAt;
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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Boolean getIsLead() {
        return isLead;
    }

    public void setIsLead(Boolean isLead) {
        this.isLead = isLead;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(String joinedAt) {
        this.joinedAt = joinedAt;
    }

    public String getLeftAt() {
        return leftAt;
    }

    public void setLeftAt(String leftAt) {
        this.leftAt = leftAt;
    }
}
