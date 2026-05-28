package com.settribe.dto;

public class ProjectRequirementDTO {
    private String id;
    private String projectId;
    private String version;
    private String title;
    private String description;
    private String addedBy;
    private String addedAt;
    private String type;
    private String clientChangeNote;

    public ProjectRequirementDTO() {}

    public ProjectRequirementDTO(String id, String projectId, String version, String title, String description, String addedBy, String addedAt, String type, String clientChangeNote) {
        this.id = id;
        this.projectId = projectId;
        this.version = version;
        this.title = title;
        this.description = description;
        this.addedBy = addedBy;
        this.addedAt = addedAt;
        this.type = type;
        this.clientChangeNote = clientChangeNote;
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

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
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

    public String getAddedBy() {
        return addedBy;
    }

    public void setAddedBy(String addedBy) {
        this.addedBy = addedBy;
    }

    public String getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(String addedAt) {
        this.addedAt = addedAt;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getClientChangeNote() {
        return clientChangeNote;
    }

    public void setClientChangeNote(String clientChangeNote) {
        this.clientChangeNote = clientChangeNote;
    }
}
