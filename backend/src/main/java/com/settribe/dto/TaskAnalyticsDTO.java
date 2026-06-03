package com.settribe.dto;

public class TaskAnalyticsDTO {
    private String taskId;
    private String taskName;
    private String assignedDate;
    private String dueDate;
    private Double estimatedHours;
    private Double actualHoursWorked;
    private String taskStatus;
    private Double efficiencyPercentage; // Actual / Estimated * 100
    private Double timeDifference; // Overrun or Saved

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }

    public String getAssignedDate() { return assignedDate; }
    public void setAssignedDate(String assignedDate) { this.assignedDate = assignedDate; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public Double getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(Double estimatedHours) { this.estimatedHours = estimatedHours; }

    public Double getActualHoursWorked() { return actualHoursWorked; }
    public void setActualHoursWorked(Double actualHoursWorked) { this.actualHoursWorked = actualHoursWorked; }

    public String getTaskStatus() { return taskStatus; }
    public void setTaskStatus(String taskStatus) { this.taskStatus = taskStatus; }

    public Double getEfficiencyPercentage() { return efficiencyPercentage; }
    public void setEfficiencyPercentage(Double efficiencyPercentage) { this.efficiencyPercentage = efficiencyPercentage; }

    public Double getTimeDifference() { return timeDifference; }
    public void setTimeDifference(Double timeDifference) { this.timeDifference = timeDifference; }
}
