package com.settribe.dto;

public class StandupRecordDTO {
    private Long id;
    private String meetingId;
    private String userId;
    private String content;
    private String createdAt;

    public StandupRecordDTO() {}

    public StandupRecordDTO(Long id, String meetingId, String userId, String content, String createdAt) {
        this.id = id;
        this.meetingId = meetingId;
        this.userId = userId;
        this.content = content;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMeetingId() {
        return meetingId;
    }

    public void setMeetingId(String meetingId) {
        this.meetingId = meetingId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
