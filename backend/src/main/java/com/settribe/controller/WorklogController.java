package com.settribe.controller;

import com.settribe.dto.WorklogAnalyticsDTO;
import com.settribe.entity.Worklog;
import com.settribe.repository.WorklogRepository;
import com.settribe.service.WorklogAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/worklogs")
@CrossOrigin(origins = "*")
public class WorklogController {

    @Autowired
    private WorklogRepository worklogRepository;

    @Autowired
    private WorklogAnalyticsService worklogAnalyticsService;

    @PostMapping
    public ResponseEntity<Worklog> createWorklog(@RequestBody Worklog worklog) {
        if (worklog.getId() == null) {
            worklog.setId(UUID.randomUUID().toString());
        }
        if (worklog.getCreatedAt() == null) {
            worklog.setCreatedAt(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
        }
        if (worklog.getDate() == null) {
            worklog.setDate(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
        }
        Worklog saved = worklogRepository.save(worklog);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Worklog>> getUserWorklogs(@PathVariable String userId) {
        return ResponseEntity.ok(worklogRepository.findByUserId(userId));
    }

    @GetMapping("/analytics/{userId}")
    public ResponseEntity<WorklogAnalyticsDTO> getUserAnalytics(@PathVariable String userId) {
        WorklogAnalyticsDTO analytics = worklogAnalyticsService.getAnalyticsForUser(userId);
        return ResponseEntity.ok(analytics);
    }
}
