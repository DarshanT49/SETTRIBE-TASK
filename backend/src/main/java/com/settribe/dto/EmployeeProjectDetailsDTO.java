package com.settribe.dto;

import com.settribe.entity.Meeting;
import java.util.List;

public class EmployeeProjectDetailsDTO {
    private List<ProjectTaskDetail> tasks;
    private List<Meeting> meetings;
    private int totalMeetingsCount;
    private List<UserDTO> teamMembers;

    public EmployeeProjectDetailsDTO() {}

    public EmployeeProjectDetailsDTO(List<ProjectTaskDetail> tasks, List<Meeting> meetings, int totalMeetingsCount, List<UserDTO> teamMembers) {
        this.tasks = tasks;
        this.meetings = meetings;
        this.totalMeetingsCount = totalMeetingsCount;
        this.teamMembers = teamMembers;
    }

    public List<ProjectTaskDetail> getTasks() {
        return tasks;
    }

    public void setTasks(List<ProjectTaskDetail> tasks) {
        this.tasks = tasks;
    }

    public List<Meeting> getMeetings() {
        return meetings;
    }

    public void setMeetings(List<Meeting> meetings) {
        this.meetings = meetings;
    }

    public int getTotalMeetingsCount() {
        return totalMeetingsCount;
    }

    public void setTotalMeetingsCount(int totalMeetingsCount) {
        this.totalMeetingsCount = totalMeetingsCount;
    }

    public List<UserDTO> getTeamMembers() {
        return teamMembers;
    }

    public void setTeamMembers(List<UserDTO> teamMembers) {
        this.teamMembers = teamMembers;
    }

    public static class ProjectTaskDetail {
        private TaskDTO task;
        private List<UserDTO> assignees;

        public ProjectTaskDetail() {}

        public ProjectTaskDetail(TaskDTO task, List<UserDTO> assignees) {
            this.task = task;
            this.assignees = assignees;
        }

        public TaskDTO getTask() {
            return task;
        }

        public void setTask(TaskDTO task) {
            this.task = task;
        }

        public List<UserDTO> getAssignees() {
            return assignees;
        }

        public void setAssignees(List<UserDTO> assignees) {
            this.assignees = assignees;
        }
    }
}
