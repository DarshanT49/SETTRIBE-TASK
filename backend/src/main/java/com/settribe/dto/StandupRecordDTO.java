package com.settribe.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class StandupRecordDTO {

    private Long id;
    private String userId;
    private String userName;
    private String meetingType;
    private LocalDate meetingDate;
    private LocalTime submissionTime;
    private String questionsAndAnswers;
    private String status;
    private String createdAt;
    private String updatedAt;

    public StandupRecordDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getMeetingType() { return meetingType; }
    public void setMeetingType(String meetingType) { this.meetingType = meetingType; }

    public LocalDate getMeetingDate() { return meetingDate; }
    public void setMeetingDate(LocalDate meetingDate) { this.meetingDate = meetingDate; }

    public LocalTime getSubmissionTime() { return submissionTime; }
    public void setSubmissionTime(LocalTime submissionTime) { this.submissionTime = submissionTime; }

    public String getQuestionsAndAnswers() { return questionsAndAnswers; }
    public void setQuestionsAndAnswers(String questionsAndAnswers) { this.questionsAndAnswers = questionsAndAnswers; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
