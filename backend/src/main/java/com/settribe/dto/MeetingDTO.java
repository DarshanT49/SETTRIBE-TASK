package com.settribe.dto;

import java.util.List;

public class MeetingDTO {
    private String id;
    private String title;
    private String agenda;
    private String date;
    private String time;
    private String duration;
    private String hostId;
    private String type;
    private String meetingMode;
    private String externalLink;
    private String projectId;
    private String status;
    private Boolean allowJoinRequests;
    private String createdAt;
    private List<String> participantIds;

    public MeetingDTO() {}

    public MeetingDTO(String id, String title, String agenda, String date, String time, String duration, String hostId, String type, String meetingMode, String externalLink, String projectId, String status, Boolean allowJoinRequests, String createdAt) {
        this.id = id;
        this.title = title;
        this.agenda = agenda;
        this.date = date;
        this.time = time;
        this.duration = duration;
        this.hostId = hostId;
        this.type = type;
        this.meetingMode = meetingMode;
        this.externalLink = externalLink;
        this.projectId = projectId;
        this.status = status;
        this.allowJoinRequests = allowJoinRequests;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAgenda() {
        return agenda;
    }

    public void setAgenda(String agenda) {
        this.agenda = agenda;
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

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getHostId() {
        return hostId;
    }

    public void setHostId(String hostId) {
        this.hostId = hostId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMeetingMode() {
        return meetingMode;
    }

    public void setMeetingMode(String meetingMode) {
        this.meetingMode = meetingMode;
    }

    public String getExternalLink() {
        return externalLink;
    }

    public void setExternalLink(String externalLink) {
        this.externalLink = externalLink;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getAllowJoinRequests() {
        return allowJoinRequests;
    }

    public void setAllowJoinRequests(Boolean allowJoinRequests) {
        this.allowJoinRequests = allowJoinRequests;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public List<String> getParticipantIds() {
        return participantIds;
    }

    public void setParticipantIds(List<String> participantIds) {
        this.participantIds = participantIds;
    }
}
