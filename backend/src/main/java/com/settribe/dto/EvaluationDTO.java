package com.settribe.dto;

public class EvaluationDTO {
    private String id;
    private String interviewId;
    private String evaluatorId;
    private String candidateName;
    private String position;
    private Double percentage;
    private Integer overallScore;
    private String recommendation;
    private String notes;
    private String skillsAssessed;
    private String candidateStrengths;
    private String areasForImprovement;
    private String recommendedNextSteps;
    private String createdAt;

    public EvaluationDTO() {}

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
