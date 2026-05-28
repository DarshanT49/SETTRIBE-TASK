package com.settribe.dto;

public class RegistrationRequestDTO {
    private String id;
    private String userId;
    private String status;
    private String requestedAt;
    private String reviewedBy;
    private String reviewedAt;
    private String rejectionReason;

    public RegistrationRequestDTO() {}

    public RegistrationRequestDTO(String id, String userId, String status, String requestedAt, String reviewedBy, String reviewedAt, String rejectionReason) {
        this.id = id;
        this.userId = userId;
        this.status = status;
        this.requestedAt = requestedAt;
        this.reviewedBy = reviewedBy;
        this.reviewedAt = reviewedAt;
        this.rejectionReason = rejectionReason;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRequestedAt() { return requestedAt; }
    public void setRequestedAt(String requestedAt) { this.requestedAt = requestedAt; }
    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
    public String getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(String reviewedAt) { this.reviewedAt = reviewedAt; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}
