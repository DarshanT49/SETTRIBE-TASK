package com.settribe.service;

import com.settribe.dto.StandupRecordDTO;
import com.settribe.entity.StandupRecord;
import com.settribe.repository.StandupRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.util.CellRangeAddress;

import jakarta.persistence.criteria.Predicate;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.Instant;

@Service
public class StandupRecordService {

    @Autowired
    private StandupRecordRepository repository;

    public List<StandupRecordDTO> findAll() {
        return repository.findAll().stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<StandupRecordDTO> filter(String startDate, String endDate, String meetingType, String userId, String status, String hostId) {
        Specification<StandupRecord> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (startDate != null && !startDate.isEmpty()) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("meetingDate"), LocalDate.parse(startDate)));
            }
            if (endDate != null && !endDate.isEmpty()) {
                predicates.add(cb.lessThanOrEqualTo(root.get("meetingDate"), LocalDate.parse(endDate)));
            }
            if (meetingType != null && !meetingType.isEmpty()) {
                predicates.add(cb.equal(root.get("meetingType"), meetingType));
            }
            if (userId != null && !userId.isEmpty()) {
                predicates.add(cb.equal(root.get("userId"), userId));
            }
            if (status != null && !status.isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (hostId != null && !hostId.isEmpty()) {
                predicates.add(cb.equal(root.get("hostId"), hostId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return repository.findAll(spec).stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public Optional<StandupRecordDTO> findById(Long id) {
        return repository.findById(id).map(this::convertToDTO);
    }

    public StandupRecordDTO save(StandupRecordDTO dto) {
        StandupRecord entity = convertToEntity(dto);
        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(Instant.now().toString());
        }
        entity.setUpdatedAt(Instant.now().toString());
        return convertToDTO(repository.save(entity));
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public byte[] generateExcelReport(List<StandupRecordDTO> records) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Standup Report");
            
            // 1. Get unique sorted dates
            List<LocalDate> uniqueDates = records.stream()
                    .map(StandupRecordDTO::getMeetingDate)
                    .filter(d -> d != null)
                    .distinct()
                    .sorted()
                    .collect(Collectors.toList());
            
            // 2. Group records by userId
            java.util.Map<String, List<StandupRecordDTO>> recordsByUser = records.stream()
                    .filter(r -> r.getUserId() != null)
                    .collect(Collectors.groupingBy(StandupRecordDTO::getUserId));
            
            // Create Styles
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            // Row 0: Date Headers
            Row dateRow = sheet.createRow(0);
            int colIndex = 2;
            for (LocalDate date : uniqueDates) {
                Cell cell = dateRow.createCell(colIndex);
                cell.setCellValue("Date: " + date.toString());
                cell.setCellStyle(headerStyle);
                sheet.addMergedRegion(new CellRangeAddress(0, 0, colIndex, colIndex + 1));
                colIndex += 2;
            }
            
            // Row 1: Sub Headers
            Row subHeaderRow = sheet.createRow(1);
            String[] fixedCols = {"Id", "Name"};
            for (int i = 0; i < fixedCols.length; i++) {
                Cell cell = subHeaderRow.createCell(i);
                cell.setCellValue(fixedCols[i]);
                cell.setCellStyle(headerStyle);
            }
            
            int subColIndex = 2;
            for (LocalDate date : uniqueDates) {
                Cell morningCell = subHeaderRow.createCell(subColIndex++);
                morningCell.setCellValue("Morning");
                morningCell.setCellStyle(headerStyle);
                
                Cell eveningCell = subHeaderRow.createCell(subColIndex++);
                eveningCell.setCellValue("Evening");
                eveningCell.setCellStyle(headerStyle);
            }
            
            // Data Rows
            int rowIdx = 2;
            for (java.util.Map.Entry<String, List<StandupRecordDTO>> entry : recordsByUser.entrySet()) {
                List<StandupRecordDTO> userRecords = entry.getValue();
                if (userRecords.isEmpty()) continue;
                
                Row row = sheet.createRow(rowIdx++);
                StandupRecordDTO sample = userRecords.get(0);
                
                row.createCell(0).setCellValue(sample.getUserId());
                row.createCell(1).setCellValue(sample.getUserName() != null ? sample.getUserName() : "");
                
                int dataColIndex = 2;
                for (LocalDate date : uniqueDates) {
                    Optional<StandupRecordDTO> morningRec = userRecords.stream()
                        .filter(r -> date.equals(r.getMeetingDate()) && "Morning".equalsIgnoreCase(r.getMeetingType()))
                        .findFirst();
                    row.createCell(dataColIndex++).setCellValue(morningRec.isPresent() && morningRec.get().getQuestionsAndAnswers() != null ? morningRec.get().getQuestionsAndAnswers() : "");
                    
                    Optional<StandupRecordDTO> eveningRec = userRecords.stream()
                        .filter(r -> date.equals(r.getMeetingDate()) && "Evening".equalsIgnoreCase(r.getMeetingType()))
                        .findFirst();
                    row.createCell(dataColIndex++).setCellValue(eveningRec.isPresent() && eveningRec.get().getQuestionsAndAnswers() != null ? eveningRec.get().getQuestionsAndAnswers() : "");
                }
            }
            
            // Auto size columns
            sheet.autoSizeColumn(0);
            sheet.autoSizeColumn(1);
            
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private StandupRecordDTO convertToDTO(StandupRecord entity) {
        StandupRecordDTO dto = new StandupRecordDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setUserName(entity.getUserName());
        dto.setMeetingType(entity.getMeetingType());
        dto.setMeetingDate(entity.getMeetingDate());
        dto.setSubmissionTime(entity.getSubmissionTime());
        dto.setQuestionsAndAnswers(entity.getQuestionsAndAnswers());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setHostId(entity.getHostId());
        return dto;
    }

    private StandupRecord convertToEntity(StandupRecordDTO dto) {
        StandupRecord entity = new StandupRecord();
        entity.setId(dto.getId());
        entity.setUserId(dto.getUserId());
        entity.setUserName(dto.getUserName());
        entity.setMeetingType(dto.getMeetingType());
        entity.setMeetingDate(dto.getMeetingDate());
        entity.setSubmissionTime(dto.getSubmissionTime());
        entity.setQuestionsAndAnswers(dto.getQuestionsAndAnswers());
        entity.setStatus(dto.getStatus());
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setUpdatedAt(dto.getUpdatedAt());
        entity.setHostId(dto.getHostId());
        return entity;
    }
}
