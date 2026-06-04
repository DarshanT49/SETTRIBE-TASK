package com.settribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "standup_records")
public class StandupRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "meeting_type")
    private String meetingType;

    @Column(name = "meeting_date")
    private LocalDate meetingDate;

    @Column(name = "submission_time")
    private LocalTime submissionTime;

    @Column(columnDefinition = "TEXT", name = "questions_and_answers")
    private String questionsAndAnswers;

    @Column(name = "status")
    private String status;

    @Column(name = "created_at")
    private String createdAt;

    @Column(name = "updated_at")
    private String updatedAt;

    @Column(name = "host_id")
    private String hostId;

    public StandupRecord() {}

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

    public String getHostId() { return hostId; }
    public void setHostId(String hostId) { this.hostId = hostId; }
}
