package com.settribe.service;

import com.settribe.dto.ProjectAnalyticsDTO;
import com.settribe.dto.TaskAnalyticsDTO;
import com.settribe.dto.WorklogAnalyticsDTO;
import com.settribe.entity.Project;
import com.settribe.entity.Task;
import com.settribe.entity.Worklog;
import com.settribe.repository.ProjectRepository;
import com.settribe.repository.TaskRepository;
import com.settribe.repository.WorklogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WorklogAnalyticsService {

    @Autowired
    private WorklogRepository worklogRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ProjectRepository projectRepository;

    public WorklogAnalyticsDTO getAnalyticsForUser(String userId) {
        List<Worklog> userWorklogs = worklogRepository.findByUserId(userId);
        
        WorklogAnalyticsDTO dto = new WorklogAnalyticsDTO();
        
        double totalHours = userWorklogs.stream().mapToDouble(Worklog::getLoggedHours).sum();
        dto.setTotalHoursWorked(totalHours);
        
        // Mock current date for simplicity or use LocalDate.now()
        LocalDate now = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        
        double thisWeek = 0;
        double thisMonth = 0;
        
        Map<String, Double> hoursPerProject = new HashMap<>();
        Map<String, Double> hoursPerCategory = new HashMap<>();
        Map<String, Double> dailyProductivity = new LinkedHashMap<>();
        
        for (Worklog log : userWorklogs) {
            try {
                LocalDate logDate = LocalDate.parse(log.getDate(), formatter);
                if (ChronoUnit.DAYS.between(logDate, now) <= 7) {
                    thisWeek += log.getLoggedHours();
                }
                if (ChronoUnit.DAYS.between(logDate, now) <= 30) {
                    thisMonth += log.getLoggedHours();
                }
                
                dailyProductivity.merge(log.getDate(), log.getLoggedHours(), Double::sum);
            } catch (Exception e) {
                // Ignore parsing errors for mock data
            }
            
            hoursPerProject.merge(log.getProjectId(), log.getLoggedHours(), Double::sum);
            
            String cat = log.getTaskCategory() != null ? log.getTaskCategory() : "Uncategorized";
            hoursPerCategory.merge(cat, log.getLoggedHours(), Double::sum);
        }
        
        dto.setHoursWorkedThisWeek(thisWeek);
        dto.setHoursWorkedThisMonth(thisMonth);
        dto.setAverageDailyHours(thisMonth / 30.0);
        dto.setAverageWeeklyHours(thisMonth / 4.0); // approx
        
        dto.setHoursPerProject(hoursPerProject);
        dto.setHoursPerCategory(hoursPerCategory);
        dto.setDailyProductivity(dailyProductivity);
        
        // Project Analytics
        List<ProjectAnalyticsDTO> projectAnalytics = new ArrayList<>();
        for (Map.Entry<String, Double> entry : hoursPerProject.entrySet()) {
            ProjectAnalyticsDTO pDto = new ProjectAnalyticsDTO();
            pDto.setProjectId(entry.getKey());
            pDto.setTotalHoursContributed(entry.getValue());
            
            try {
                projectRepository.findById(Long.parseLong(entry.getKey())).ifPresent(p -> {
                    pDto.setProjectName(p.getTitle());
                    pDto.setProjectStatus(p.getStatus());
                });
            } catch (NumberFormatException e) {}
            
            pDto.setProjectContributionPercentage(totalHours > 0 ? (entry.getValue() / totalHours) * 100 : 0);
            // Count unique tasks
            long tasksCount = userWorklogs.stream()
                .filter(w -> entry.getKey().equals(w.getProjectId()))
                .map(Worklog::getTaskId)
                .distinct()
                .count();
            pDto.setTasksWorkedOn((int) tasksCount);
            pDto.setAverageHoursPerTask(tasksCount > 0 ? entry.getValue() / tasksCount : 0);
            
            projectAnalytics.add(pDto);
        }
        dto.setProjectAnalytics(projectAnalytics);
        
        // Task Analytics
        Map<String, List<Worklog>> logsByTask = userWorklogs.stream().collect(Collectors.groupingBy(Worklog::getTaskId));
        List<TaskAnalyticsDTO> taskAnalytics = new ArrayList<>();
        
        double totalEstimated = 0;
        double totalActualForEstimates = 0;
        
        for (Map.Entry<String, List<Worklog>> entry : logsByTask.entrySet()) {
            TaskAnalyticsDTO tDto = new TaskAnalyticsDTO();
            tDto.setTaskId(entry.getKey());
            
            double actual = entry.getValue().stream().mapToDouble(Worklog::getLoggedHours).sum();
            tDto.setActualHoursWorked(actual);
            
            try {
                taskRepository.findById(Long.parseLong(entry.getKey())).ifPresent(t -> {
                    tDto.setTaskName(t.getTitle());
                    tDto.setAssignedDate(t.getStartDate());
                    tDto.setDueDate(t.getDueDate());
                    tDto.setTaskStatus(t.getStatus());
                    if (t.getEstimatedHours() != null) {
                        tDto.setEstimatedHours(t.getEstimatedHours());
                        tDto.setEfficiencyPercentage(t.getEstimatedHours() > 0 ? (actual / t.getEstimatedHours()) * 100 : 0);
                        tDto.setTimeDifference(actual - t.getEstimatedHours()); // Overrun if > 0, Saved if < 0
                    }
                });
            } catch (NumberFormatException e) {}
            
            taskAnalytics.add(tDto);
            
            if (tDto.getEstimatedHours() != null && tDto.getEstimatedHours() > 0) {
                totalEstimated += tDto.getEstimatedHours();
                totalActualForEstimates += actual;
            }
        }
        dto.setTaskAnalytics(taskAnalytics);
        
        dto.setEfficiencyScore(totalEstimated > 0 ? (totalActualForEstimates / totalEstimated) * 100 : 100.0);
        
        // Mock AI Insights
        List<String> insights = new ArrayList<>();
        insights.add("Your task completion efficiency is at " + String.format("%.1f", dto.getEfficiencyScore()) + "%.");
        if (projectAnalytics.size() > 0) {
            projectAnalytics.sort((a, b) -> Double.compare(b.getTotalHoursContributed(), a.getTotalHoursContributed()));
            insights.add("Most of your effort is currently dedicated to " + projectAnalytics.get(0).getProjectName() + ".");
        }
        insights.add("You average " + String.format("%.1f", dto.getAverageDailyHours()) + " hours per day this month.");
        dto.setAiInsights(insights);

        return dto;
    }
}
