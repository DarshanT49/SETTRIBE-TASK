package com.settribe.controller;

import com.settribe.entity.CandidateFeedback;
import com.settribe.repository.CandidateFeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

import java.util.List;

@RestController
@RequestMapping("/api/candidate-feedback")

public class CandidateFeedbackController {

    @Autowired
    private CandidateFeedbackRepository feedbackRepository;

    @GetMapping
    public List<CandidateFeedback> getAllFeedbacks() {
        return feedbackRepository.findAll();
    }

    @GetMapping("/interview/{interviewId}")
    public List<CandidateFeedback> getFeedbacksByInterview(@PathVariable String interviewId) {
        return feedbackRepository.findByInterviewId(interviewId);
    }

    @PostMapping
    public CandidateFeedback createFeedback(@RequestBody CandidateFeedback feedback) {
        if (feedback.getId() == null || feedback.getId().isEmpty()) {
            feedback.setId(UUID.randomUUID().toString());
        }
        if (feedback.getCreatedAt() == null || feedback.getCreatedAt().isEmpty()) {
            feedback.setCreatedAt(java.time.Instant.now().toString());
        }
        return feedbackRepository.save(feedback);
    }
}
