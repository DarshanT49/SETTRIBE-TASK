package com.settribe.dto;

import java.util.List;

public class DashboardDTO {
    // Top-level stats
    private long totalProjects;
    private long activeProjects;
    private long completedProjects;
    
    private long totalTasks;
    private long myTasks;
    private long pendingTasks;
    
    private long totalUsers;
    private long activeUsers;
    
    private long todayMeetings;
    private long todayInterviews;
    
    // Aggregations
    private List<TaskStatusCountDTO> taskStatusDistribution;
    private List<TeamProductivityDTO> teamProductivity;
    private List<WeeklyTasksDTO> weeklyTasks;
    
    // Role specific
    private long pendingApprovals;
    private long activeMilestones;

    // Lists for Dashboard views
    private List<com.settribe.entity.Milestone> delayedMilestones;
    private List<com.settribe.entity.Meeting> upcomingMeetings;
    private List<com.settribe.entity.RegistrationRequest> pendingRegistrationRequests;
    private List<com.settribe.entity.Interview> todayInterviewsList;
    private List<com.settribe.entity.Project> myProjects;
    private List<com.settribe.entity.Task> overdueTasks;
    private List<com.settribe.entity.Interview> myInterviewsList;

    public DashboardDTO() {
    }

    public long getTotalProjects() {
        return totalProjects;
    }

    public void setTotalProjects(long totalProjects) {
        this.totalProjects = totalProjects;
    }

    public long getActiveProjects() {
        return activeProjects;
    }

    public void setActiveProjects(long activeProjects) {
        this.activeProjects = activeProjects;
    }

    public long getCompletedProjects() {
        return completedProjects;
    }

    public void setCompletedProjects(long completedProjects) {
        this.completedProjects = completedProjects;
    }

    public long getTotalTasks() {
        return totalTasks;
    }

    public void setTotalTasks(long totalTasks) {
        this.totalTasks = totalTasks;
    }

    public long getMyTasks() {
        return myTasks;
    }

    public void setMyTasks(long myTasks) {
        this.myTasks = myTasks;
    }

    public long getPendingTasks() {
        return pendingTasks;
    }

    public void setPendingTasks(long pendingTasks) {
        this.pendingTasks = pendingTasks;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public long getTodayMeetings() {
        return todayMeetings;
    }

    public void setTodayMeetings(long todayMeetings) {
        this.todayMeetings = todayMeetings;
    }

    public long getTodayInterviews() {
        return todayInterviews;
    }

    public void setTodayInterviews(long todayInterviews) {
        this.todayInterviews = todayInterviews;
    }

    public List<TaskStatusCountDTO> getTaskStatusDistribution() {
        return taskStatusDistribution;
    }

    public void setTaskStatusDistribution(List<TaskStatusCountDTO> taskStatusDistribution) {
        this.taskStatusDistribution = taskStatusDistribution;
    }

    public List<TeamProductivityDTO> getTeamProductivity() {
        return teamProductivity;
    }

    public void setTeamProductivity(List<TeamProductivityDTO> teamProductivity) {
        this.teamProductivity = teamProductivity;
    }

    public List<WeeklyTasksDTO> getWeeklyTasks() {
        return weeklyTasks;
    }

    public void setWeeklyTasks(List<WeeklyTasksDTO> weeklyTasks) {
        this.weeklyTasks = weeklyTasks;
    }

    public long getPendingApprovals() {
        return pendingApprovals;
    }

    public void setPendingApprovals(long pendingApprovals) {
        this.pendingApprovals = pendingApprovals;
    }

    public long getActiveMilestones() {
        return activeMilestones;
    }

    public void setActiveMilestones(long activeMilestones) {
        this.activeMilestones = activeMilestones;
    }

    public List<com.settribe.entity.Milestone> getDelayedMilestones() {
        return delayedMilestones;
    }

    public void setDelayedMilestones(List<com.settribe.entity.Milestone> delayedMilestones) {
        this.delayedMilestones = delayedMilestones;
    }

    public List<com.settribe.entity.Meeting> getUpcomingMeetings() {
        return upcomingMeetings;
    }

    public void setUpcomingMeetings(List<com.settribe.entity.Meeting> upcomingMeetings) {
        this.upcomingMeetings = upcomingMeetings;
    }

    public List<com.settribe.entity.RegistrationRequest> getPendingRegistrationRequests() {
        return pendingRegistrationRequests;
    }

    public void setPendingRegistrationRequests(List<com.settribe.entity.RegistrationRequest> pendingRegistrationRequests) {
        this.pendingRegistrationRequests = pendingRegistrationRequests;
    }

    public List<com.settribe.entity.Interview> getTodayInterviewsList() {
        return todayInterviewsList;
    }

    public void setTodayInterviewsList(List<com.settribe.entity.Interview> todayInterviewsList) {
        this.todayInterviewsList = todayInterviewsList;
    }

    public List<com.settribe.entity.Project> getMyProjects() {
        return myProjects;
    }

    public void setMyProjects(List<com.settribe.entity.Project> myProjects) {
        this.myProjects = myProjects;
    }

    public List<com.settribe.entity.Task> getOverdueTasks() {
        return overdueTasks;
    }

    public void setOverdueTasks(List<com.settribe.entity.Task> overdueTasks) {
        this.overdueTasks = overdueTasks;
    }

    public List<com.settribe.entity.Interview> getMyInterviewsList() {
        return myInterviewsList;
    }

    public void setMyInterviewsList(List<com.settribe.entity.Interview> myInterviewsList) {
        this.myInterviewsList = myInterviewsList;
    }
}
