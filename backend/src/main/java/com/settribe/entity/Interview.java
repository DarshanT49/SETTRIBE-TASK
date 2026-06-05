package com.settribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Table;

@Entity
@Table(name = "interviews", indexes = {
        @jakarta.persistence.Index(name = "idx_interviews_interviewer_id", columnList = "interviewerId"),
        @jakarta.persistence.Index(name = "idx_interviews_status", columnList = "status"),
        @jakarta.persistence.Index(name = "idx_interviews_date", columnList = "date")
})
public class Interview {
    @Id
    private String id;
    @Column(columnDefinition = "TEXT")
    private String candidateName;
    @Column(columnDefinition = "TEXT")
    private String mobile;
    @Column(columnDefinition = "TEXT")
    private String email;
    @Column(columnDefinition = "TEXT")
    private String referredBy;
    @Column(columnDefinition = "TEXT")
    private String position;
    @Column(columnDefinition = "TEXT")
    private String interviewType;
    @Column(columnDefinition = "TEXT")
    private String date;
    @Column(columnDefinition = "TEXT")
    private String time;
    @Column(columnDefinition = "TEXT")
    private String link;
    private String interviewerId;
    private String status;
    @Column(columnDefinition = "TEXT")
    private String token;
    @Column(length = 1000)
    private String notes;
    @Column(columnDefinition = "TEXT")
    private String resumeFileName;
    @Column(columnDefinition = "TEXT")
    private String candidatePortalStatus;
    @Column(columnDefinition = "TEXT")
    private String createdAt;
    @Column(columnDefinition = "TEXT")
    private String expiryTimestamp;
    @Column(columnDefinition = "TEXT")
    private String joinStatus;

    // New fields added to match frontend
    @Column(columnDefinition = "TEXT")
    private String mode;
    @Column(columnDefinition = "TEXT")
    private String duration;
    @Column(columnDefinition = "TEXT")
    private String department;
    @Column(columnDefinition = "TEXT")
    private String round;
    @Column(columnDefinition = "TEXT")
    private String panelIds; // We can store this as a comma-separated string or JSON array
    @Column(columnDefinition = "TEXT")
    private String meetingId;

    public Interview() {
    }

    public Interview(String id, String candidateName, String mobile, String email, String referredBy, String position,
            String interviewType, String date, String time, String link, String interviewerId, String status,
            String token, String notes, String resumeFileName, String candidatePortalStatus, String createdAt) {
        this.id = id;
        this.candidateName = candidateName;
        this.mobile = mobile;
        this.email = email;
        this.referredBy = referredBy;
        this.position = position;
        this.interviewType = interviewType;
        this.date = date;
        this.time = time;
        this.link = link;
        this.interviewerId = interviewerId;
        this.status = status;
        this.token = token;
        this.notes = notes;
        this.resumeFileName = resumeFileName;
        this.candidatePortalStatus = candidatePortalStatus;
        this.createdAt = createdAt;
    }

    public Interview(String id, String candidateName, String mobile, String email, String referredBy, String position,
            String interviewType, String date, String time, String link, String interviewerId, String status,
            String token, String notes, String resumeFileName, String candidatePortalStatus, String createdAt,
            String expiryTimestamp, String joinStatus) {
        this.id = id;
        this.candidateName = candidateName;
        this.mobile = mobile;
        this.email = email;
        this.referredBy = referredBy;
        this.position = position;
        this.interviewType = interviewType;
        this.date = date;
        this.time = time;
        this.link = link;
        this.interviewerId = interviewerId;
        this.status = status;
        this.token = token;
        this.notes = notes;
        this.resumeFileName = resumeFileName;
        this.candidatePortalStatus = candidatePortalStatus;
        this.createdAt = createdAt;
        this.expiryTimestamp = expiryTimestamp;
        this.joinStatus = joinStatus;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getReferredBy() {
        return referredBy;
    }

    public void setReferredBy(String referredBy) {
        this.referredBy = referredBy;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getInterviewType() {
        return interviewType;
    }

    public void setInterviewType(String interviewType) {
        this.interviewType = interviewType;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public String getLink() {
        return link;
    }

    public void setLink(String link) {
        this.link = link;
    }

    public String getInterviewerId() {
        return interviewerId;
    }

    public void setInterviewerId(String interviewerId) {
        this.interviewerId = interviewerId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getResumeFileName() {
        return resumeFileName;
    }

    public void setResumeFileName(String resumeFileName) {
        this.resumeFileName = resumeFileName;
    }

    public String getCandidatePortalStatus() {
        return candidatePortalStatus;
    }

    public void setCandidatePortalStatus(String candidatePortalStatus) {
        this.candidatePortalStatus = candidatePortalStatus;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getExpiryTimestamp() {
        return expiryTimestamp;
    }

    public void setExpiryTimestamp(String expiryTimestamp) {
        this.expiryTimestamp = expiryTimestamp;
    }

    public String getJoinStatus() {
        return joinStatus;
    }

    public void setJoinStatus(String joinStatus) {
        this.joinStatus = joinStatus;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getRound() {
        return round;
    }

    public void setRound(String round) {
        this.round = round;
    }

    public String getPanelIds() {
        return panelIds;
    }

    public void setPanelIds(String panelIds) {
        this.panelIds = panelIds;
    }

    public String getMeetingId() {
        return meetingId;
    }

    public void setMeetingId(String meetingId) {
        this.meetingId = meetingId;
    }
}
