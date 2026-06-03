package com.settribe.controller;

import com.settribe.dto.StandupRecordDTO;
import com.settribe.service.StandupRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.util.List;
import java.time.format.DateTimeFormatter;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/standup")
public class StandupController {

    @Autowired
    private StandupRecordService service;

    @PostMapping
    public ResponseEntity<StandupRecordDTO> create(@RequestBody StandupRecordDTO record) {
        return ResponseEntity.ok(service.save(record));
    }

    @GetMapping
    public ResponseEntity<List<StandupRecordDTO>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/filter")
    public ResponseEntity<List<StandupRecordDTO>> filter(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String meetingType,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(service.filter(startDate, endDate, meetingType, userId, status));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportToExcel(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String meetingType,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String status) {
        try {
            List<StandupRecordDTO> records = service.filter(startDate, endDate, meetingType, userId, status);
            byte[] excelData = service.generateExcelReport(records);
            
            String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
            String filename = "standup-report-" + dateStr + ".xlsx";
            
            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=" + filename);
            headers.add("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            
            return new ResponseEntity<>(excelData, headers, HttpStatus.OK);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
