package com.settribe.dto;

import java.util.List;
import java.util.Map;

public class WorklogAnalyticsDTO {
    private Double totalHoursWorked;
    private Double hoursWorkedThisWeek;
    private Double hoursWorkedThisMonth;
    private Double averageDailyHours;
    private Double averageWeeklyHours;
    
    private List<ProjectAnalyticsDTO> projectAnalytics;
    private List<TaskAnalyticsDTO> taskAnalytics;
    
    private Map<String, Double> dailyProductivity;
    private Map<String, Double> weeklyProductivity;
    private Map<String, Double> monthlyProductivity;
    private Map<String, Double> hoursPerProject;
    private Map<String, Double> hoursPerCategory;
    
    private Double efficiencyScore;
    private List<String> aiInsights;

    // Getters and setters
    public Double getTotalHoursWorked() { return totalHoursWorked; }
    public void setTotalHoursWorked(Double totalHoursWorked) { this.totalHoursWorked = totalHoursWorked; }

    public Double getHoursWorkedThisWeek() { return hoursWorkedThisWeek; }
    public void setHoursWorkedThisWeek(Double hoursWorkedThisWeek) { this.hoursWorkedThisWeek = hoursWorkedThisWeek; }

    public Double getHoursWorkedThisMonth() { return hoursWorkedThisMonth; }
    public void setHoursWorkedThisMonth(Double hoursWorkedThisMonth) { this.hoursWorkedThisMonth = hoursWorkedThisMonth; }

    public Double getAverageDailyHours() { return averageDailyHours; }
    public void setAverageDailyHours(Double averageDailyHours) { this.averageDailyHours = averageDailyHours; }

    public Double getAverageWeeklyHours() { return averageWeeklyHours; }
    public void setAverageWeeklyHours(Double averageWeeklyHours) { this.averageWeeklyHours = averageWeeklyHours; }

    public List<ProjectAnalyticsDTO> getProjectAnalytics() { return projectAnalytics; }
    public void setProjectAnalytics(List<ProjectAnalyticsDTO> projectAnalytics) { this.projectAnalytics = projectAnalytics; }

    public List<TaskAnalyticsDTO> getTaskAnalytics() { return taskAnalytics; }
    public void setTaskAnalytics(List<TaskAnalyticsDTO> taskAnalytics) { this.taskAnalytics = taskAnalytics; }

    public Map<String, Double> getDailyProductivity() { return dailyProductivity; }
    public void setDailyProductivity(Map<String, Double> dailyProductivity) { this.dailyProductivity = dailyProductivity; }

    public Map<String, Double> getWeeklyProductivity() { return weeklyProductivity; }
    public void setWeeklyProductivity(Map<String, Double> weeklyProductivity) { this.weeklyProductivity = weeklyProductivity; }

    public Map<String, Double> getMonthlyProductivity() { return monthlyProductivity; }
    public void setMonthlyProductivity(Map<String, Double> monthlyProductivity) { this.monthlyProductivity = monthlyProductivity; }

    public Map<String, Double> getHoursPerProject() { return hoursPerProject; }
    public void setHoursPerProject(Map<String, Double> hoursPerProject) { this.hoursPerProject = hoursPerProject; }

    public Map<String, Double> getHoursPerCategory() { return hoursPerCategory; }
    public void setHoursPerCategory(Map<String, Double> hoursPerCategory) { this.hoursPerCategory = hoursPerCategory; }

    public Double getEfficiencyScore() { return efficiencyScore; }
    public void setEfficiencyScore(Double efficiencyScore) { this.efficiencyScore = efficiencyScore; }

    public List<String> getAiInsights() { return aiInsights; }
    public void setAiInsights(List<String> aiInsights) { this.aiInsights = aiInsights; }
}
