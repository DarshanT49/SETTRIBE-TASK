package com.settribe.dto;

public class TaskStatusCountDTO {
    private String status;
    private long count;

    public TaskStatusCountDTO() {
    }

    public TaskStatusCountDTO(String status, long count) {
        this.status = status;
        this.count = count;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }
}
