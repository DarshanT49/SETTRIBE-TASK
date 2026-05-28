package com.settribe.dto;

public class MeetingRsvpDTO {
    private String id;
    private String meetingId;
    private String userId;
    private String status;
    private String reason;
    private String timestamp;
    private String notes;

    public MeetingRsvpDTO() {}

    public MeetingRsvpDTO(String id, String meetingId, String userId, String status, String reason, String timestamp, String notes) {
        this.id = id;
        this.meetingId = meetingId;
        this.userId = userId;
        this.status = status;
        this.reason = reason;
        this.timestamp = timestamp;
        this.notes = notes;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
