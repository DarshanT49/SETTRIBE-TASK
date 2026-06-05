package com.settribe.dto;

import java.util.List;

/**
 * Single aggregated response for the Employee Dashboard endpoint.
 * GET /api/employees/{id}/dashboard
 */
public class EmployeeDashboardResponseDTO {
    private UserDTO employee;
    private EmployeeKpiDTO kpis;
    private List<TaskTimelineItemDTO> timeline;
    private List<EmployeeProjectSummaryDTO> projects;
    private List<EmployeeProjectSummaryDTO> pastProjects;

    public EmployeeDashboardResponseDTO() {}

    public EmployeeDashboardResponseDTO(UserDTO employee, EmployeeKpiDTO kpis,
                                         List<TaskTimelineItemDTO> timeline,
                                         List<EmployeeProjectSummaryDTO> projects,
                                         List<EmployeeProjectSummaryDTO> pastProjects) {
        this.employee = employee;
        this.kpis = kpis;
        this.timeline = timeline;
        this.projects = projects;
        this.pastProjects = pastProjects;
    }

    public UserDTO getEmployee() { return employee; }
    public void setEmployee(UserDTO employee) { this.employee = employee; }

    public EmployeeKpiDTO getKpis() { return kpis; }
    public void setKpis(EmployeeKpiDTO kpis) { this.kpis = kpis; }

    public List<TaskTimelineItemDTO> getTimeline() { return timeline; }
    public void setTimeline(List<TaskTimelineItemDTO> timeline) { this.timeline = timeline; }

    public List<EmployeeProjectSummaryDTO> getProjects() { return projects; }
    public void setProjects(List<EmployeeProjectSummaryDTO> projects) { this.projects = projects; }

    public List<EmployeeProjectSummaryDTO> getPastProjects() { return pastProjects; }
    public void setPastProjects(List<EmployeeProjectSummaryDTO> pastProjects) { this.pastProjects = pastProjects; }
}
