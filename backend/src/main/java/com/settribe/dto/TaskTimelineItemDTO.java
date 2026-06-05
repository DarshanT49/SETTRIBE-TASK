package com.settribe.dto;

/**
 * Represents a single chronological event in an employee's activity timeline.
 * Sources: task_status_history, worklogs, standup_records.
 */
public class TaskTimelineItemDTO {
    private String eventType;   // "TASK_STATUS_CHANGE" | "WORKLOG" | "STANDUP"
    private String occurredAt;  // ISO-8601 string (date or datetime)
    private String title;       // Human-readable summary

    // Task-specific fields (nullable for non-task events)
    private Long taskId;
    private String taskTitle;
    private String fromStatus;
    private String toStatus;
    private String priority;

    // Project context (nullable)
    private Long projectId;
    private String projectTitle;

    // Worklog-specific fields (nullable)
    private Double loggedHours;
    private String workDescription;

    // Standup-specific fields (nullable)
    private String meetingType;

    public TaskTimelineItemDTO() {}

    // Getters and Setters
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getOccurredAt() { return occurredAt; }
    public void setOccurredAt(String occurredAt) { this.occurredAt = occurredAt; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public String getTaskTitle() { return taskTitle; }
    public void setTaskTitle(String taskTitle) { this.taskTitle = taskTitle; }

    public String getFromStatus() { return fromStatus; }
    public void setFromStatus(String fromStatus) { this.fromStatus = fromStatus; }

    public String getToStatus() { return toStatus; }
    public void setToStatus(String toStatus) { this.toStatus = toStatus; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public String getProjectTitle() { return projectTitle; }
    public void setProjectTitle(String projectTitle) { this.projectTitle = projectTitle; }

    public Double getLoggedHours() { return loggedHours; }
    public void setLoggedHours(Double loggedHours) { this.loggedHours = loggedHours; }

    public String getWorkDescription() { return workDescription; }
    public void setWorkDescription(String workDescription) { this.workDescription = workDescription; }

    public String getMeetingType() { return meetingType; }
    public void setMeetingType(String meetingType) { this.meetingType = meetingType; }
}
