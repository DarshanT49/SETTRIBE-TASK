package com.settribe.service;

import com.settribe.dto.*;
import com.settribe.dto.EmployeeProjectDetailsDTO;
import com.settribe.dto.TaskDTO;
import com.settribe.entity.*;
import com.settribe.mapper.UserMapper;
import com.settribe.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import com.settribe.entity.Meeting;
import com.settribe.repository.MeetingRepository;
import com.settribe.mapper.TaskMapper;

/**
 * Aggregates all data needed for the Employee Detailed Dashboard in a single service call.
 * Designed for performance: all DB queries are scoped to a single employeeId,
 * avoiding full-table scans and N+1 patterns.
 *
 * Timeline merges three event sources:
 *   1. task_status_history  — task transitions made by this employee
 *   2. worklogs             — time logged by this employee
 *   3. standup_records      — standup submissions by this employee
 */
@Service
public class EmployeeDashboardService {

    @Autowired private UserRepository userRepository;
    @Autowired private TaskAssigneeRepository taskAssigneeRepository;
    @Autowired private TaskRepository taskRepository;
    @Autowired private TaskStatusHistoryRepository taskStatusHistoryRepository;
    @Autowired private ProjectMemberRepository projectMemberRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private WorklogRepository worklogRepository;
    @Autowired private StandupRecordRepository standupRecordRepository;
    @Autowired private MeetingRepository meetingRepository;

    public EmployeeDashboardResponseDTO buildDashboard(Long employeeId) {
        // 1. Fetch employee — throws if not found
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        // 2. Fetch tasks assigned to this employee
        List<Long> taskIds = taskAssigneeRepository.findTaskIdsByUserId(employeeId);
        List<Task> tasks = taskIds.isEmpty() ? List.of() : taskRepository.findAllById(taskIds);

        // 3. Fetch all project memberships
        List<ProjectMember> allMemberships = projectMemberRepository.findByUserId(employeeId);
        List<Long> allProjectIds = allMemberships.stream().map(ProjectMember::getProjectId).collect(Collectors.toList());
        List<Project> allProjects = allProjectIds.isEmpty() ? List.of() : projectRepository.findAllById(allProjectIds);

        Map<Long, String> membershipStatusMap = allMemberships.stream()
                .collect(Collectors.toMap(ProjectMember::getProjectId, ProjectMember::getStatus, (a, b) -> a));

        List<Project> activeProjects = new ArrayList<>();
        List<Project> pastProjectsList = new ArrayList<>();

        for (Project p : allProjects) {
            String pmStatus = membershipStatusMap.get(p.getId());
            boolean isProjectCompleted = "completed".equalsIgnoreCase(p.getStatus()) || "done".equalsIgnoreCase(p.getStatus());
            boolean isMembershipActive = "ACTIVE".equalsIgnoreCase(pmStatus);

            if (isProjectCompleted) {
                pastProjectsList.add(p);
            } else if (isMembershipActive) {
                activeProjects.add(p);
            }
        }

        // Build a quick lookup for timeline: projectId → Project
        Map<Long, Project> projectMap = allProjects.stream()
                .collect(Collectors.toMap(Project::getId, p -> p));

        // 4. Compute KPIs (using all projects or active projects? Usually KPIs use all tasks, so activeProjects.size() is better for totalProjects)
        EmployeeKpiDTO kpis = computeKpis(tasks, activeProjects.size(), allProjects);

        // 5. Build timeline (merged + sorted)
        List<TaskTimelineItemDTO> timeline = buildTimeline(employeeId, tasks, projectMap);

        // 6. Build per-project summaries
        List<EmployeeProjectSummaryDTO> activeProjectSummaries = buildProjectSummaries(
                employeeId, activeProjects, tasks);
        List<EmployeeProjectSummaryDTO> pastProjectSummaries = buildProjectSummaries(
                employeeId, pastProjectsList, tasks);

        return new EmployeeDashboardResponseDTO(
                UserMapper.toDTO(employee), kpis, timeline, activeProjectSummaries, pastProjectSummaries);
    }

    // ─── KPI Computation ─────────────────────────────────────────────────────

    private EmployeeKpiDTO computeKpis(List<Task> tasks, int totalProjects, List<Project> projects) {
        String now = LocalDate.now().toString();

        int completed = 0, pending = 0, overdue = 0;
        long totalDays = 0;
        int countWithDates = 0;

        for (Task t : tasks) {
            String status = t.getStatus();
            if ("done".equalsIgnoreCase(status)) {
                completed++;
                // Approximate turnaround: startDate → dueDate
                if (t.getStartDate() != null && t.getDueDate() != null) {
                    try {
                        LocalDate start = LocalDate.parse(t.getStartDate().substring(0, 10));
                        LocalDate due = LocalDate.parse(t.getDueDate().substring(0, 10));
                        totalDays += Math.max(0, ChronoUnit.DAYS.between(start, due));
                        countWithDates++;
                    } catch (DateTimeParseException ignored) {}
                }
            } else {
                pending++;
                if (t.getDueDate() != null) {
                    try {
                        LocalDate due = LocalDate.parse(t.getDueDate().substring(0, 10));
                        if (due.isBefore(LocalDate.now())) overdue++;
                    } catch (DateTimeParseException ignored) {}
                }
            }
        }

        int total = tasks.size();
        double completionRate = total == 0 ? 0.0 : Math.round((completed * 100.0 / total) * 10.0) / 10.0;
        double avgTurnaround = countWithDates == 0 ? 0.0 : Math.round((totalDays * 10.0 / countWithDates)) / 10.0;

        return new EmployeeKpiDTO(totalProjects, completed, pending, overdue, completionRate, avgTurnaround);
    }

    // ─── Timeline Builder ─────────────────────────────────────────────────────

    private List<TaskTimelineItemDTO> buildTimeline(Long employeeId, List<Task> tasks, Map<Long, Project> projectMap) {
        List<TaskTimelineItemDTO> events = new ArrayList<>();

        // Map taskId → Task for quick lookup
        Map<Long, Task> taskMap = tasks.stream()
                .collect(Collectors.toMap(Task::getId, t -> t));

        // Source 1: Task status history
        List<TaskStatusHistory> statusHistory =
                taskStatusHistoryRepository.findByChangedByUserIdOrderByChangedAtDesc(employeeId);

        for (TaskStatusHistory h : statusHistory) {
            Task task = taskMap.get(h.getTaskId());
            TaskTimelineItemDTO item = new TaskTimelineItemDTO();
            item.setEventType("TASK_STATUS_CHANGE");
            item.setOccurredAt(h.getChangedAt());
            item.setFromStatus(h.getOldStatus());
            item.setToStatus(h.getNewStatus());

            if (task != null) {
                item.setTaskId(task.getId());
                item.setTaskTitle(task.getTitle());
                item.setPriority(task.getPriority());
                item.setTitle("Task moved to \"" + h.getNewStatus() + "\": " + task.getTitle());

                Project proj = task.getProjectId() != null ? projectMap.get(task.getProjectId()) : null;
                if (proj != null) {
                    item.setProjectId(proj.getId());
                    item.setProjectTitle(proj.getTitle());
                }
            } else {
                item.setTitle("Task status changed to \"" + h.getNewStatus() + "\"");
            }
            events.add(item);
        }

        // Source 2: Worklogs
        List<Worklog> worklogs = worklogRepository.findByUserId(String.valueOf(employeeId));
        for (Worklog w : worklogs) {
            TaskTimelineItemDTO item = new TaskTimelineItemDTO();
            item.setEventType("WORKLOG");
            item.setOccurredAt(w.getCreatedAt() != null ? w.getCreatedAt() : w.getDate());
            item.setLoggedHours(w.getLoggedHours());
            item.setWorkDescription(w.getDescription());
            String hoursLabel = w.getLoggedHours() != null ? w.getLoggedHours() + "h logged" : "Hours logged";
            item.setTitle(hoursLabel + (w.getDescription() != null ? " — " + w.getDescription() : ""));

            // Resolve task + project context
            if (w.getTaskId() != null) {
                try {
                    Long tId = Long.parseLong(w.getTaskId());
                    Task task = taskMap.get(tId);
                    if (task != null) {
                        item.setTaskId(task.getId());
                        item.setTaskTitle(task.getTitle());
                        Project proj = task.getProjectId() != null ? projectMap.get(task.getProjectId()) : null;
                        if (proj != null) {
                            item.setProjectId(proj.getId());
                            item.setProjectTitle(proj.getTitle());
                        }
                    }
                } catch (NumberFormatException ignored) {}
            }
            if (w.getProjectId() != null && item.getProjectId() == null) {
                try {
                    Long pId = Long.parseLong(w.getProjectId());
                    Project proj = projectMap.get(pId);
                    if (proj != null) {
                        item.setProjectId(proj.getId());
                        item.setProjectTitle(proj.getTitle());
                    }
                } catch (NumberFormatException ignored) {}
            }
            events.add(item);
        }

        // Source 3: Standup records
        List<StandupRecord> standups =
                standupRecordRepository.findByUserIdOrderByMeetingDateDesc(String.valueOf(employeeId));
        for (StandupRecord s : standups) {
            TaskTimelineItemDTO item = new TaskTimelineItemDTO();
            item.setEventType("STANDUP");
            String dateStr = s.getMeetingDate() != null ? s.getMeetingDate().toString() : s.getCreatedAt();
            item.setOccurredAt(dateStr);
            item.setMeetingType(s.getMeetingType());
            item.setTitle("Standup submitted — " + (s.getMeetingType() != null ? s.getMeetingType() : "daily"));
            events.add(item);
        }

        // Sort all events newest-first by occurredAt
        events.sort((a, b) -> {
            String dateA = a.getOccurredAt() != null ? a.getOccurredAt() : "";
            String dateB = b.getOccurredAt() != null ? b.getOccurredAt() : "";
            return dateB.compareTo(dateA);
        });

        // Cap at 100 most recent events to keep response size manageable
        return events.size() > 100 ? events.subList(0, 100) : events;
    }

    // ─── Project Summary Builder ──────────────────────────────────────────────

    private List<EmployeeProjectSummaryDTO> buildProjectSummaries(
            Long employeeId, List<Project> projects, List<Task> tasks) {

        // Group tasks by projectId
        Map<Long, List<Task>> tasksByProject = tasks.stream()
                .filter(t -> t.getProjectId() != null)
                .collect(Collectors.groupingBy(Task::getProjectId));

        // Get isLead flags for this employee
        List<ProjectMember> memberships = projectMemberRepository.findByUserId(employeeId);
        Map<Long, Boolean> leadFlags = memberships.stream()
                .collect(Collectors.toMap(ProjectMember::getProjectId,
                        m -> Boolean.TRUE.equals(m.getIsLead()), (a, b) -> a));

        List<EmployeeProjectSummaryDTO> summaries = new ArrayList<>();
        for (Project p : projects) {
            EmployeeProjectSummaryDTO dto = new EmployeeProjectSummaryDTO();
            dto.setProjectId(p.getId());
            dto.setTitle(p.getTitle());
            dto.setStatus(p.getStatus());
            dto.setPriority(p.getPriority());
            dto.setProgress(p.getProgress() != null ? p.getProgress() : 0);
            dto.setDeadline(p.getDeadline());
            dto.setLead(Boolean.TRUE.equals(leadFlags.get(p.getId())));

            List<Task> projectTasks = tasksByProject.getOrDefault(p.getId(), List.of());
            dto.setTasksAssigned(projectTasks.size());
            dto.setTasksCompleted((int) projectTasks.stream()
                    .filter(t -> "done".equalsIgnoreCase(t.getStatus())).count());
            summaries.add(dto);
        }
        return summaries;
    }

    public EmployeeProjectDetailsDTO getProjectDetailsForEmployee(Long employeeId, Long projectId) {
        // 1. Fetch team members for the project
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
        List<Long> memberIds = members.stream().map(ProjectMember::getUserId).collect(Collectors.toList());
        List<UserDTO> teamMembers = new ArrayList<>();
        if (!memberIds.isEmpty()) {
            teamMembers = userRepository.findAllById(memberIds).stream()
                .map(UserMapper::toDTO)
                .collect(Collectors.toList());
        }

        // 2. Fetch ALL tasks for the project and map to ProjectTaskDetail
        List<Task> allProjectTasks = taskRepository.findByProjectId(projectId);
        List<EmployeeProjectDetailsDTO.ProjectTaskDetail> projectTasks = new ArrayList<>();
        
        for (Task t : allProjectTasks) {
            List<TaskAssignee> assignees = taskAssigneeRepository.findByTaskId(t.getId());
            List<Long> assigneeIds = assignees.stream().map(TaskAssignee::getUserId).collect(Collectors.toList());
            List<UserDTO> taskAssigneeUsers = new ArrayList<>();
            if (!assigneeIds.isEmpty()) {
                taskAssigneeUsers = userRepository.findAllById(assigneeIds).stream()
                    .map(UserMapper::toDTO)
                    .collect(Collectors.toList());
            }
            projectTasks.add(new EmployeeProjectDetailsDTO.ProjectTaskDetail(TaskMapper.toDTO(t), taskAssigneeUsers));
        }

        // 3. Fetch meetings related to the project
        List<Meeting> projectMeetings = meetingRepository.findByProjectId(String.valueOf(projectId));
        
        return new EmployeeProjectDetailsDTO(
            projectTasks,
            projectMeetings,
            projectMeetings.size(),
            teamMembers
        );
    }
}
