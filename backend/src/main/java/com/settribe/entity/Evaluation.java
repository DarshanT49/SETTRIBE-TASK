package com.settribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Table;

@Entity
@Table(name = "evaluations")
public class Evaluation {
    @Id
    private String id;
    @Column(columnDefinition = "TEXT")
    private String interviewId;
    @Column(columnDefinition = "TEXT")
    private String evaluatorId;
    @Column(columnDefinition = "TEXT")
    private String candidateName;
    @Column(columnDefinition = "TEXT")
    private String position;
    private Double percentage;
    private Integer overallScore;
    @Column(columnDefinition = "TEXT")
    private String recommendation;
    @Column(length = 2000)
    private String notes;
    @Column(columnDefinition = "TEXT")
    private String skillsAssessed;
    @Column(columnDefinition = "TEXT")
    private String candidateStrengths;
    @Column(columnDefinition = "TEXT")
    private String areasForImprovement;
    @Column(columnDefinition = "TEXT")
    private String recommendedNextSteps;
    @Column(columnDefinition = "TEXT")
    private String createdAt;

    public Evaluation() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getInterviewId() { return interviewId; }
    public void setInterviewId(String interviewId) { this.interviewId = interviewId; }
    public String getEvaluatorId() { return evaluatorId; }
    public void setEvaluatorId(String evaluatorId) { this.evaluatorId = evaluatorId; }
    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public Double getPercentage() { return percentage; }
    public void setPercentage(Double percentage) { this.percentage = percentage; }
    public Integer getOverallScore() { return overallScore; }
    public void setOverallScore(Integer overallScore) { this.overallScore = overallScore; }
    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getSkillsAssessed() { return skillsAssessed; }
    public void setSkillsAssessed(String skillsAssessed) { this.skillsAssessed = skillsAssessed; }
    public String getCandidateStrengths() { return candidateStrengths; }
    public void setCandidateStrengths(String candidateStrengths) { this.candidateStrengths = candidateStrengths; }
    public String getAreasForImprovement() { return areasForImprovement; }
    public void setAreasForImprovement(String areasForImprovement) { this.areasForImprovement = areasForImprovement; }
    public String getRecommendedNextSteps() { return recommendedNextSteps; }
    public void setRecommendedNextSteps(String recommendedNextSteps) { this.recommendedNextSteps = recommendedNextSteps; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
