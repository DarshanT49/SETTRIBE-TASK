package com.settribe.service;

import com.settribe.entity.Project;
import com.settribe.entity.ProjectMember;
import com.settribe.repository.ProjectMemberRepository;
import com.settribe.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import com.settribe.dto.ProjectDTO;
import com.settribe.mapper.ProjectMapper;
import java.util.Optional;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository repository;

    @Autowired
    private ProjectMemberRepository memberRepository;

    public List<ProjectMember> getMembers(Long projectId) {
        return memberRepository.findByProjectIdAndStatus(projectId, "ACTIVE");
    }

    public ProjectMember addMember(Long projectId, Long userId, Boolean isLead) {
        ProjectMember member = memberRepository.findByProjectIdAndUserId(projectId, userId).orElse(null);
        if (member == null) {
            member = new ProjectMember();
            member.setProjectId(projectId);
            member.setUserId(userId);
            member.setStatus("ACTIVE");
            member.setJoinedAt(java.time.Instant.now().toString());
        }
        member.setIsLead(isLead);
        return memberRepository.save(member);
    }

    public void removeMember(Long projectId, Long userId) {
        ProjectMember member = memberRepository.findByProjectIdAndUserId(projectId, userId).orElse(null);
        if (member != null) {
            member.setStatus("LEFT");
            member.setLeftAt(java.time.Instant.now().toString());
            memberRepository.save(member);
        }
    }

    public List<ProjectDTO> findAll() {
        return repository.findAll().stream().map(ProjectMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<ProjectDTO> findById(Long id) {
        return repository.findById(id).map(ProjectMapper::toDTO);
    }

    public ProjectDTO save(ProjectDTO dto) {
        Project entity = ProjectMapper.toEntity(dto);
        return ProjectMapper.toDTO(repository.save(entity));
    }

    public ProjectDTO update(Long id, ProjectDTO dto) {
        if(repository.existsById(id)) {
            Project entity = ProjectMapper.toEntity(dto);
            entity.setId(id);
            return ProjectMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
