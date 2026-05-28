package com.settribe.dto;

public class InterviewDTO {
    private String id;
    private String candidateName;
    private String mobile;
    private String email;
    private String referredBy;
    private String position;
    private String interviewType;
    private String date;
    private String time;
    private String link;
    private String interviewerId;
    private String status;
    private String token;
    private String notes;
    private String resumeFileName;
    private String candidatePortalStatus;
    private String createdAt;

    public InterviewDTO() {}

    public InterviewDTO(String id, String candidateName, String mobile, String email, String referredBy, String position, String interviewType, String date, String time, String link, String interviewerId, String status, String token, String notes, String resumeFileName, String candidatePortalStatus, String createdAt) {
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
}
