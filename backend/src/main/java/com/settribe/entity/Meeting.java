package com.settribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.Table;

@Entity
@Table(name = "meetings")
public class Meeting {
    @Id
    private String id;
    @Column(columnDefinition = "TEXT")
    private String title;
    @Column(columnDefinition = "TEXT")
    private String agenda;
    @Column(columnDefinition = "TEXT")
    private String date;
    @Column(columnDefinition = "TEXT")
    private String time;
    @Column(columnDefinition = "TEXT")
    private String duration;
    @Column(columnDefinition = "TEXT")
    private String hostId;
    @Column(columnDefinition = "TEXT")
    private String type;
    @Column(columnDefinition = "TEXT")
    private String meetingMode;
    @Column(columnDefinition = "TEXT")
    private String externalLink;
    @Column(columnDefinition = "TEXT")
    private String projectId;
    @Column(columnDefinition = "TEXT")
    private String status;
    private Boolean allowJoinRequests;
    @Column(columnDefinition = "TEXT")
    private String createdAt;
    @Column(columnDefinition = "TEXT")
    private String participantIds; // stored as JSON array string
    @Column(columnDefinition = "TEXT")
    private String joinRequests; // stored as JSON array string
    @Column(columnDefinition = "TEXT")
    private String chatLogs; // stored as JSON array string
    @Column(columnDefinition = "TEXT")
    private String standupLogs; // stored as JSON array string
    @Column(columnDefinition = "TEXT")
    private String taskAssignedInMeeting; // stored as JSON array string
    @Column(columnDefinition = "TEXT")
    private String attendanceLogs; // stored as JSON array string

    public Meeting() {
    }

    public Meeting(String id, String title, String agenda, String date, String time, String duration, String hostId, String type, String meetingMode, String externalLink, String projectId, String status, Boolean allowJoinRequests, String createdAt) {
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

    public String getParticipantIds() {
        return participantIds;
    }

    public void setParticipantIds(String participantIds) {
        this.participantIds = participantIds;
    }

    public String getJoinRequests() {
        return joinRequests;
    }

    public void setJoinRequests(String joinRequests) {
        this.joinRequests = joinRequests;
    }

    public String getChatLogs() {
        return chatLogs;
    }

    public void setChatLogs(String chatLogs) {
        this.chatLogs = chatLogs;
    }

    public String getStandupLogs() {
        return standupLogs;
    }

    public void setStandupLogs(String standupLogs) {
        this.standupLogs = standupLogs;
    }

    public String getTaskAssignedInMeeting() {
        return taskAssignedInMeeting;
    }

    public void setTaskAssignedInMeeting(String taskAssignedInMeeting) {
        this.taskAssignedInMeeting = taskAssignedInMeeting;
    }

    public String getAttendanceLogs() {
        return attendanceLogs;
    }

    public void setAttendanceLogs(String attendanceLogs) {
        this.attendanceLogs = attendanceLogs;
    }
}



