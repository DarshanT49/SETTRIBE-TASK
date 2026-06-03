package com.settribe.mapper;

import com.settribe.dto.EvaluationDTO;
import com.settribe.entity.Evaluation;

public class EvaluationMapper {
    public static EvaluationDTO toDTO(Evaluation e) {
        if (e == null) return null;
        EvaluationDTO d = new EvaluationDTO();
        d.setId(e.getId());
        d.setInterviewId(e.getInterviewId());
        d.setEvaluatorId(e.getEvaluatorId());
        d.setCandidateName(e.getCandidateName());
        d.setPosition(e.getPosition());
        d.setPercentage(e.getPercentage());
        d.setSkillsAssessed(e.getSkillsAssessed());
        d.setCandidateStrengths(e.getCandidateStrengths());
        d.setAreasForImprovement(e.getAreasForImprovement());
        d.setRecommendedNextSteps(e.getRecommendedNextSteps());
        d.setOverallScore(e.getOverallScore());
        d.setRecommendation(e.getRecommendation());
        d.setNotes(e.getNotes());
        d.setCreatedAt(e.getCreatedAt());
        return d;
    }

    public static Evaluation toEntity(EvaluationDTO d) {
        if (d == null) return null;
        Evaluation e = new Evaluation();
        e.setId(d.getId());
        e.setInterviewId(d.getInterviewId());
        e.setEvaluatorId(d.getEvaluatorId());
        e.setCandidateName(d.getCandidateName());
        e.setPosition(d.getPosition());
        e.setPercentage(d.getPercentage());
        e.setSkillsAssessed(d.getSkillsAssessed());
        e.setCandidateStrengths(d.getCandidateStrengths());
        e.setAreasForImprovement(d.getAreasForImprovement());
        e.setRecommendedNextSteps(d.getRecommendedNextSteps());
        e.setOverallScore(d.getOverallScore());
        e.setRecommendation(d.getRecommendation());
        e.setNotes(d.getNotes());
        e.setCreatedAt(d.getCreatedAt());
        return e;
    }
}
