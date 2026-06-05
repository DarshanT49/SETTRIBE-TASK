package com.settribe.dto;

public class TeamProductivityDTO {
    private String userName;
    private long completedTasks;
    private long pendingTasks;

    public TeamProductivityDTO() {
    }

    public TeamProductivityDTO(String userName, long completedTasks, long pendingTasks) {
        this.userName = userName;
        this.completedTasks = completedTasks;
        this.pendingTasks = pendingTasks;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public long getCompletedTasks() {
        return completedTasks;
    }

    public void setCompletedTasks(long completedTasks) {
        this.completedTasks = completedTasks;
    }

    public long getPendingTasks() {
        return pendingTasks;
    }

    public void setPendingTasks(long pendingTasks) {
        this.pendingTasks = pendingTasks;
    }
}
