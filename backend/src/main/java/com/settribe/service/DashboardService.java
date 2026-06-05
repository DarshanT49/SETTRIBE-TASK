package com.settribe.service;

import com.settribe.dto.DashboardDTO;
import com.settribe.dto.TaskStatusCountDTO;
import com.settribe.dto.TeamProductivityDTO;
import com.settribe.dto.WeeklyTasksDTO;
import com.settribe.entity.User;
import com.settribe.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class DashboardService {

    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private MeetingRepository meetingRepository;
    
    @Autowired
    private InterviewRepository interviewRepository;
    
    @Autowired
    private RegistrationRequestRepository registrationRequestRepository;
    
    @Autowired
    private MilestoneRepository milestoneRepository;

    public DashboardDTO getDashboardData(String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail);
        DashboardDTO dto = new DashboardDTO();
        
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        
        if (currentUser != null) {
            String role = currentUser.getRole();
            
            List<com.settribe.entity.Project> allProjects = projectRepository.findAll();
            List<com.settribe.entity.Meeting> allMeetings = meetingRepository.findAll();
            
            // Basic role-agnostic stats
            dto.setTotalProjects(allProjects.size());
            dto.setActiveProjects(allProjects.stream().filter(p -> "In Progress".equalsIgnoreCase(p.getStatus()) || "Active".equalsIgnoreCase(p.getStatus())).count());
            dto.setCompletedProjects(allProjects.stream().filter(p -> "Completed".equalsIgnoreCase(p.getStatus())).count());
            
            dto.setTotalTasks(taskRepository.count());
            dto.setPendingTasks(taskRepository.countByStatus("Pending"));
            dto.setMyTasks(taskRepository.countByAssignedBy(currentUser.getId()));
            
            dto.setTodayMeetings(allMeetings.stream().filter(m -> today.equals(m.getDate())).count());
            
            // Only admins or HR might care about users and interviews
            if ("Admin".equalsIgnoreCase(role) || "HR".equalsIgnoreCase(role)) {
                dto.setTotalUsers(userRepository.count());
                dto.setActiveUsers(userRepository.countByIsActive(true));
                
                List<com.settribe.entity.Interview> todayInterviews = interviewRepository.findAll()
                        .stream().filter(i -> today.equals(i.getDate())).toList();
                dto.setTodayInterviews(todayInterviews.size());
                dto.setTodayInterviewsList(todayInterviews);
                
                List<com.settribe.entity.RegistrationRequest> pendingReg = registrationRequestRepository.findAll()
                        .stream().filter(r -> "pending".equalsIgnoreCase(r.getStatus())).toList();
                dto.setPendingApprovals(pendingReg.size());
                dto.setPendingRegistrationRequests(pendingReg);
            }
            
            if ("Admin".equalsIgnoreCase(role) || "Manager".equalsIgnoreCase(role)) {
                List<com.settribe.entity.Milestone> delayed = milestoneRepository.findAll()
                        .stream().filter(m -> "delayed".equalsIgnoreCase(m.getStatus())).toList();
                dto.setDelayedMilestones(delayed);
                dto.setActiveMilestones(milestoneRepository.countByStatus("In Progress"));
            }

            if ("Admin".equalsIgnoreCase(role)) {
                List<com.settribe.entity.Meeting> upcoming = allMeetings.stream().filter(m -> m.getDate() != null && m.getDate().compareTo(today) >= 0).toList();
                dto.setUpcomingMeetings(upcoming);
            }
            
            if ("HR".equalsIgnoreCase(role)) {
                // HR needs todayMeetings
                dto.setTodayMeetings(allMeetings.stream().filter(m -> today.equals(m.getDate())).count());
            }

            if ("Manager".equalsIgnoreCase(role) || "Employee".equalsIgnoreCase(role) || "Intern".equalsIgnoreCase(role)) {
                List<com.settribe.entity.Project> myProjects = allProjects.stream().filter(p -> {
                    String strId = String.valueOf(currentUser.getId());
                    return String.valueOf(p.getManagerId()).equals(strId) || 
                           String.valueOf(p.getOwnerId()).equals(strId) ||
                           (p.getTeamIds() != null && p.getTeamIds().contains(strId));
                }).toList();
                dto.setMyProjects(myProjects);
                
                List<com.settribe.entity.Meeting> upcoming = allMeetings.stream().filter(m -> {
                    String strId = String.valueOf(currentUser.getId());
                    return m.getDate() != null && m.getDate().compareTo(today) >= 0 &&
                           m.getParticipantIds() != null && m.getParticipantIds().contains(strId);
                }).toList();
                dto.setUpcomingMeetings(upcoming);
                
                List<com.settribe.entity.Task> allTasks = taskRepository.findAll();
                List<com.settribe.entity.Task> myTasks = allTasks.stream().filter(t -> t.getAssigneeIds() != null && t.getAssigneeIds().contains(String.valueOf(currentUser.getId()))).toList();
                List<com.settribe.entity.Task> overdue = myTasks.stream().filter(t -> !"done".equalsIgnoreCase(t.getStatus()) && t.getDueDate() != null && t.getDueDate().compareTo(today) < 0).toList();
                dto.setOverdueTasks(overdue);
                
                long pendingTasks = myTasks.stream().filter(t -> !"done".equalsIgnoreCase(t.getStatus())).count();
                dto.setPendingTasks(pendingTasks);

                if ("Manager".equalsIgnoreCase(role)) {
                    long pendingApprovals = allTasks.stream().filter(t -> "in_review".equalsIgnoreCase(t.getStatus()) && myProjects.stream().anyMatch(p -> String.valueOf(p.getId()).equals(t.getProjectId()))).count();
                    dto.setPendingApprovals(pendingApprovals);
                }
            }

            if ("Panel".equalsIgnoreCase(role) || "Employee".equalsIgnoreCase(role) || "Intern".equalsIgnoreCase(role)) {
                 List<com.settribe.entity.Interview> myInterviews = interviewRepository.findAll().stream().filter(i -> {
                     String strId = String.valueOf(currentUser.getId());
                     return String.valueOf(i.getInterviewerId()).equals(strId) || (i.getPanelIds() != null && i.getPanelIds().contains(strId));
                 }).toList();
                 dto.setMyInterviewsList(myInterviews);
            }
            
            // Task Status Dist (for Admin/Manager)
            List<TaskStatusCountDTO> statusDist = new ArrayList<>();
            statusDist.add(new TaskStatusCountDTO("Done", taskRepository.countByStatus("done")));
            statusDist.add(new TaskStatusCountDTO("In Review", taskRepository.countByStatus("in_review")));
            statusDist.add(new TaskStatusCountDTO("In Progress", taskRepository.countByStatus("in_progress")));
            statusDist.add(new TaskStatusCountDTO("Backlog", taskRepository.countByStatus("backlog")));
            dto.setTaskStatusDistribution(statusDist);
            
            // Dummy data for team productivity
            List<TeamProductivityDTO> teamProd = new ArrayList<>();
            teamProd.add(new TeamProductivityDTO("Team A", 10, 5));
            dto.setTeamProductivity(teamProd);
            
            // Dummy data for weekly tasks
            List<WeeklyTasksDTO> weekly = new ArrayList<>();
            weekly.add(new WeeklyTasksDTO("Mon", 5));
            weekly.add(new WeeklyTasksDTO("Tue", 8));
            dto.setWeeklyTasks(weekly);
        }
        
        return dto;
    }
}
