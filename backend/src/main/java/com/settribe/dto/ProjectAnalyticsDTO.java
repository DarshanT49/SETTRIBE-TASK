package com.settribe.dto;

public class ProjectAnalyticsDTO {
    private String projectId;
    private String projectName;
    private String projectStatus;
    private Double totalHoursContributed;
    private Integer tasksWorkedOn;
    private Double averageHoursPerTask;
    private Double projectContributionPercentage;

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getProjectStatus() { return projectStatus; }
    public void setProjectStatus(String projectStatus) { this.projectStatus = projectStatus; }

    public Double getTotalHoursContributed() { return totalHoursContributed; }
    public void setTotalHoursContributed(Double totalHoursContributed) { this.totalHoursContributed = totalHoursContributed; }

    public Integer getTasksWorkedOn() { return tasksWorkedOn; }
    public void setTasksWorkedOn(Integer tasksWorkedOn) { this.tasksWorkedOn = tasksWorkedOn; }

    public Double getAverageHoursPerTask() { return averageHoursPerTask; }
    public void setAverageHoursPerTask(Double averageHoursPerTask) { this.averageHoursPerTask = averageHoursPerTask; }

    public Double getProjectContributionPercentage() { return projectContributionPercentage; }
    public void setProjectContributionPercentage(Double projectContributionPercentage) { this.projectContributionPercentage = projectContributionPercentage; }
}
