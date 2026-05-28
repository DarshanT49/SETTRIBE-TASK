package com.settribe.dto;

public class EvaluationDTO {
    private String id;
    private String interviewId;
    private String evaluatorId;
    private String candidateName;
    private String position;
    private Integer technicalScore;
    private Integer communicationScore;
    private Integer problemSolvingScore;
    private Integer cultureFitScore;
    private Integer overallScore;
    private String recommendation;
    private String notes;
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
    public Integer getTechnicalScore() { return technicalScore; }
    public void setTechnicalScore(Integer technicalScore) { this.technicalScore = technicalScore; }
    public Integer getCommunicationScore() { return communicationScore; }
    public void setCommunicationScore(Integer communicationScore) { this.communicationScore = communicationScore; }
    public Integer getProblemSolvingScore() { return problemSolvingScore; }
    public void setProblemSolvingScore(Integer problemSolvingScore) { this.problemSolvingScore = problemSolvingScore; }
    public Integer getCultureFitScore() { return cultureFitScore; }
    public void setCultureFitScore(Integer cultureFitScore) { this.cultureFitScore = cultureFitScore; }
    public Integer getOverallScore() { return overallScore; }
    public void setOverallScore(Integer overallScore) { this.overallScore = overallScore; }
    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
