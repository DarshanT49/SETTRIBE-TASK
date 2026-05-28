package com.settribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Table;

@Entity
@Table(name = "registration_requests")
public class RegistrationRequest {
    @Id
    private String id;
    @Column(columnDefinition = "TEXT")
    private String userId;
    @Column(columnDefinition = "TEXT")
    private String status;
    @Column(columnDefinition = "TEXT")
    private String requestedAt;
    @Column(columnDefinition = "TEXT")
    private String reviewedBy;
    @Column(columnDefinition = "TEXT")
    private String reviewedAt;
    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    public RegistrationRequest() {}

    public RegistrationRequest(String id, String userId, String status, String requestedAt, String reviewedBy, String reviewedAt, String rejectionReason) {
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
