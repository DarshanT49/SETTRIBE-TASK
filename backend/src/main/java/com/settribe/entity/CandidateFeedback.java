package com.settribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Table;

@Entity
@Table(name = "candidate_feedback")
public class CandidateFeedback {
    @Id
    private String id;
    
    @Column(columnDefinition = "TEXT")
    private String interviewId;
    
    @Column(columnDefinition = "TEXT")
    private String candidateName;
    
    private Integer experienceRating;
    private Integer videoQualityRating;
    private Integer audioQualityRating;
    private Integer platformRating;
    private Integer joiningEaseRating;
    private Integer overallRating;
    
    @Column(columnDefinition = "TEXT")
    private String comments;
    
    @Column(columnDefinition = "TEXT")
    private String createdAt;

    public CandidateFeedback() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getInterviewId() { return interviewId; }
    public void setInterviewId(String interviewId) { this.interviewId = interviewId; }
    
    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }
    
    public Integer getExperienceRating() { return experienceRating; }
    public void setExperienceRating(Integer experienceRating) { this.experienceRating = experienceRating; }
    
    public Integer getVideoQualityRating() { return videoQualityRating; }
    public void setVideoQualityRating(Integer videoQualityRating) { this.videoQualityRating = videoQualityRating; }
    
    public Integer getAudioQualityRating() { return audioQualityRating; }
    public void setAudioQualityRating(Integer audioQualityRating) { this.audioQualityRating = audioQualityRating; }
    
    public Integer getPlatformRating() { return platformRating; }
    public void setPlatformRating(Integer platformRating) { this.platformRating = platformRating; }
    
    public Integer getJoiningEaseRating() { return joiningEaseRating; }
    public void setJoiningEaseRating(Integer joiningEaseRating) { this.joiningEaseRating = joiningEaseRating; }
    
    public Integer getOverallRating() { return overallRating; }
    public void setOverallRating(Integer overallRating) { this.overallRating = overallRating; }
    
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
    
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
