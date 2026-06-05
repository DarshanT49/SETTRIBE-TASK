package com.settribe.controller;

import com.settribe.dto.EmployeeDashboardResponseDTO;
import com.settribe.service.EmployeeDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for the Employee Detailed Dashboard feature.
 * Provides a single aggregated endpoint that replaces multiple frontend N+1 calls.
 *
 * All endpoints are restricted to Admin and HR roles.
 */
@RestController
@RequestMapping("/api/employees")
public class EmployeeDashboardController {

    @Autowired
    private EmployeeDashboardService dashboardService;

    /**
     * GET /api/employees/{id}/dashboard
     *
     * Returns the full aggregated dashboard payload for one employee:
     *   - Employee profile (UserDTO)
     *   - KPIs (projects count, tasks completed/pending/overdue, completion rate)
     *   - Timeline (task status changes + worklogs + standup submissions, newest first)
     *   - Project summaries (per-project task breakdown with isLead flag)
     *
     * @param id  The numeric user ID of the employee.
     */
    @GetMapping("/{id}/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<EmployeeDashboardResponseDTO> getDashboard(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(dashboardService.buildDashboard(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/projects/{projectId}/details")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<com.settribe.dto.EmployeeProjectDetailsDTO> getProjectDetails(
            @PathVariable Long id, 
            @PathVariable Long projectId) {
        try {
            return ResponseEntity.ok(dashboardService.getProjectDetailsForEmployee(id, projectId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
