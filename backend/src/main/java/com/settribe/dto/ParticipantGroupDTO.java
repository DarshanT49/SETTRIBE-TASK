package com.settribe.dto;

import java.util.List;

public class ParticipantGroupDTO {
    private Long id;
    private String name;
    private String createdBy;
    private List<String> participantIds;
    private List<String> sharedWith;
    private String createdAt;
    private String updatedAt;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public List<String> getParticipantIds() {
        return participantIds;
    }

    public void setParticipantIds(List<String> participantIds) {
        this.participantIds = participantIds;
    }

    public List<String> getSharedWith() {
        return sharedWith;
    }

    public void setSharedWith(List<String> sharedWith) {
        this.sharedWith = sharedWith;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
