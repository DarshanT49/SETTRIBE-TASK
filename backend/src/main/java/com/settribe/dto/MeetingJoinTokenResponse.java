package com.settribe.dto;

public class MeetingJoinTokenResponse {
    private String url;
    private String token;
    private String roomName;

    public MeetingJoinTokenResponse(String url, String token, String roomName) {
        this.url = url;
        this.token = token;
        this.roomName = roomName;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }
}
