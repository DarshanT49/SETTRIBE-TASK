package com.settribe.controller;

import com.settribe.service.EvaluationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.settribe.dto.EvaluationDTO;

@RestController
@RequestMapping("/api/evaluations")
public class EvaluationController {

    @Autowired
    private EvaluationService service;

    @GetMapping
    public List<EvaluationDTO> getAll() {
        return service.findAll();
    }

    /** GET /api/evaluations/{id} — fetch by the evaluation's own primary-key id */
    @GetMapping("/{id}")
    public ResponseEntity<EvaluationDTO> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/evaluations/interview/{interviewId}
     * Fetch the evaluation that belongs to a specific interview.
     * This is what InterviewDetail uses to load evaluation data.
     */
    @GetMapping("/interview/{interviewId}")
    public ResponseEntity<EvaluationDTO> getByInterviewId(@PathVariable String interviewId) {
        return service.findByInterviewId(interviewId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** POST /api/evaluations — create a new evaluation (id is auto-generated if missing) */
    @PostMapping
    public EvaluationDTO create(@RequestBody EvaluationDTO entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EvaluationDTO> update(@PathVariable String id, @RequestBody EvaluationDTO entity) {
        try {
            return ResponseEntity.ok(service.update(id, entity));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
