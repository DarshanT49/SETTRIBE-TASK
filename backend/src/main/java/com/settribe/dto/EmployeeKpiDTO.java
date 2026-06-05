package com.settribe.dto;

public class EmployeeKpiDTO {
    private int totalProjects;
    private int totalTasksCompleted;
    private int totalTasksPending;
    private int totalTasksOverdue;
    private double completionRate;
    private double avgTurnaroundDays;

    public EmployeeKpiDTO() {}

    public EmployeeKpiDTO(int totalProjects, int totalTasksCompleted, int totalTasksPending,
                          int totalTasksOverdue, double completionRate, double avgTurnaroundDays) {
        this.totalProjects = totalProjects;
        this.totalTasksCompleted = totalTasksCompleted;
        this.totalTasksPending = totalTasksPending;
        this.totalTasksOverdue = totalTasksOverdue;
        this.completionRate = completionRate;
        this.avgTurnaroundDays = avgTurnaroundDays;
    }

    public int getTotalProjects() { return totalProjects; }
    public void setTotalProjects(int totalProjects) { this.totalProjects = totalProjects; }

    public int getTotalTasksCompleted() { return totalTasksCompleted; }
    public void setTotalTasksCompleted(int totalTasksCompleted) { this.totalTasksCompleted = totalTasksCompleted; }

    public int getTotalTasksPending() { return totalTasksPending; }
    public void setTotalTasksPending(int totalTasksPending) { this.totalTasksPending = totalTasksPending; }

    public int getTotalTasksOverdue() { return totalTasksOverdue; }
    public void setTotalTasksOverdue(int totalTasksOverdue) { this.totalTasksOverdue = totalTasksOverdue; }

    public double getCompletionRate() { return completionRate; }
    public void setCompletionRate(double completionRate) { this.completionRate = completionRate; }

    public double getAvgTurnaroundDays() { return avgTurnaroundDays; }
    public void setAvgTurnaroundDays(double avgTurnaroundDays) { this.avgTurnaroundDays = avgTurnaroundDays; }
}
