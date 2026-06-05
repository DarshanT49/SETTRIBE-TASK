package com.settribe.dto;

public class EmployeeProjectSummaryDTO {
    private Long projectId;
    private String title;
    private String status;
    private String priority;
    private int progress;
    private int tasksAssigned;
    private int tasksCompleted;
    private String deadline;
    private boolean isLead;

    public EmployeeProjectSummaryDTO() {}

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public int getProgress() { return progress; }
    public void setProgress(int progress) { this.progress = progress; }

    public int getTasksAssigned() { return tasksAssigned; }
    public void setTasksAssigned(int tasksAssigned) { this.tasksAssigned = tasksAssigned; }

    public int getTasksCompleted() { return tasksCompleted; }
    public void setTasksCompleted(int tasksCompleted) { this.tasksCompleted = tasksCompleted; }

    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }

    public boolean isLead() { return isLead; }
    public void setLead(boolean lead) { isLead = lead; }
}
