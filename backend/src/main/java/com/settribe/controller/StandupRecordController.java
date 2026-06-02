package com.settribe.controller;

import com.settribe.dto.StandupRecordDTO;
import com.settribe.service.StandupRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meetings/{meetingId}/standups")
@CrossOrigin(origins = "*")
public class StandupRecordController {

    @Autowired
    private StandupRecordService service;

    @GetMapping
    public ResponseEntity<List<StandupRecordDTO>> getByMeetingId(@PathVariable String meetingId) {
        return ResponseEntity.ok(service.findByMeetingId(meetingId));
    }

    @PostMapping
    public ResponseEntity<List<StandupRecordDTO>> saveAll(@PathVariable String meetingId, @RequestBody List<StandupRecordDTO> records) {
        // Ensure meetingId is set correctly on incoming records
        records.forEach(r -> r.setMeetingId(meetingId));
        return ResponseEntity.ok(service.saveAll(records));
    }
}
