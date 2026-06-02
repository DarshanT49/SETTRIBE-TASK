package com.settribe.dto;

public class ChatMessageDTO {
    private String id;
    private String meetingId;
    private String userId;
    private String senderId;
    private String text;
    private String timestamp;

    public ChatMessageDTO() {}

    public ChatMessageDTO(String id, String meetingId, String userId, String senderId, String text, String timestamp) {
        this.id = id;
        this.meetingId = meetingId;
        this.userId = userId;
        this.senderId = senderId;
        this.text = text;
        this.timestamp = timestamp;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getMeetingId() { return meetingId; }
    public void setMeetingId(String meetingId) { this.meetingId = meetingId; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
    
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
