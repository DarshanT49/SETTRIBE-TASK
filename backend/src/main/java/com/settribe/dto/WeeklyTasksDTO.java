package com.settribe.dto;

public class WeeklyTasksDTO {
    private String day;
    private long tasks;

    public WeeklyTasksDTO() {
    }

    public WeeklyTasksDTO(String day, long tasks) {
        this.day = day;
        this.tasks = tasks;
    }

    public String getDay() {
        return day;
    }

    public void setDay(String day) {
        this.day = day;
    }

    public long getTasks() {
        return tasks;
    }

    public void setTasks(long tasks) {
        this.tasks = tasks;
    }
}
