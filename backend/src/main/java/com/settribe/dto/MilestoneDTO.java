package com.settribe.dto;

public class MilestoneDTO {
    private String id;
    private String projectId;
    private String title;
    private String description;
    private String targetDate;
    private String actualDate;
    private String status;
    private Boolean isLocked;
    private Integer delayDays;
    private String delayReason;
    private String delayedAt;
    private String rescheduledDate;
    private Integer completionPct;
    private Integer milestoneOrder;

    public MilestoneDTO() {}

    public MilestoneDTO(String id, String projectId, String title, String description, String targetDate, String actualDate, String status, Boolean isLocked, Integer delayDays, String delayReason, String delayedAt, String rescheduledDate, Integer completionPct, Integer milestoneOrder) {
        this.id = id;
        this.projectId = projectId;
        this.title = title;
        this.description = description;
        this.targetDate = targetDate;
        this.actualDate = actualDate;
        this.status = status;
        this.isLocked = isLocked;
        this.delayDays = delayDays;
        this.delayReason = delayReason;
        this.delayedAt = delayedAt;
        this.rescheduledDate = rescheduledDate;
        this.completionPct = completionPct;
        this.milestoneOrder = milestoneOrder;
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

    public String getTargetDate() {
        return targetDate;
    }

    public void setTargetDate(String targetDate) {
        this.targetDate = targetDate;
    }

    public String getActualDate() {
        return actualDate;
    }

    public void setActualDate(String actualDate) {
        this.actualDate = actualDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getIsLocked() {
        return isLocked;
    }

    public void setIsLocked(Boolean isLocked) {
        this.isLocked = isLocked;
    }

    public Integer getDelayDays() {
        return delayDays;
    }

    public void setDelayDays(Integer delayDays) {
        this.delayDays = delayDays;
    }

    public String getDelayReason() {
        return delayReason;
    }

    public void setDelayReason(String delayReason) {
        this.delayReason = delayReason;
    }

    public String getDelayedAt() {
        return delayedAt;
    }

    public void setDelayedAt(String delayedAt) {
        this.delayedAt = delayedAt;
    }

    public String getRescheduledDate() {
        return rescheduledDate;
    }

    public void setRescheduledDate(String rescheduledDate) {
        this.rescheduledDate = rescheduledDate;
    }

    public Integer getCompletionPct() {
        return completionPct;
    }

    public void setCompletionPct(Integer completionPct) {
        this.completionPct = completionPct;
    }

    public Integer getMilestoneOrder() {
        return milestoneOrder;
    }

    public void setMilestoneOrder(Integer milestoneOrder) {
        this.milestoneOrder = milestoneOrder;
    }
}
