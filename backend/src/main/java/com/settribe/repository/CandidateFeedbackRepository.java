package com.settribe.repository;

import com.settribe.entity.CandidateFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateFeedbackRepository extends JpaRepository<CandidateFeedback, String> {
    List<CandidateFeedback> findByInterviewId(String interviewId);
}
