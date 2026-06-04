package com.settribe.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.settribe.dto.ParticipantGroupDTO;
import com.settribe.entity.ParticipantGroup;
import com.settribe.exception.GroupNotFoundException;
import com.settribe.repository.ParticipantGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class ParticipantGroupService {

    @Autowired
    private ParticipantGroupRepository repository;

    private final ObjectMapper mapper = new ObjectMapper();

    public List<ParticipantGroupDTO> getGroupsForUser(String userId) {
        List<ParticipantGroup> createdGroups = repository.findByCreatedBy(userId);
        List<ParticipantGroup> sharedGroups = repository.findBySharedWithContaining("\"" + userId + "\""); // Simple contains check based on JSON array
        
        return Stream.concat(createdGroups.stream(), sharedGroups.stream())
                .distinct()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ParticipantGroupDTO createGroup(ParticipantGroupDTO dto, String creatorId) {
        ParticipantGroup entity = new ParticipantGroup();
        entity.setName(dto.getName());
        entity.setCreatedBy(creatorId);
        entity.setParticipantIds(toJson(dto.getParticipantIds()));
        entity.setSharedWith("[]");
        entity.setCreatedAt(Instant.now().toString());
        entity.setUpdatedAt(Instant.now().toString());
        return convertToDTO(repository.save(entity));
    }

    public ParticipantGroupDTO updateGroup(Long id, ParticipantGroupDTO dto, String userId) {
        ParticipantGroup entity = repository.findById(id)
                .orElseThrow(() -> new GroupNotFoundException("Group not found with id " + id));

        if (!entity.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Only the creator can update the group");
        }

        entity.setName(dto.getName());
        entity.setParticipantIds(toJson(dto.getParticipantIds()));
        entity.setUpdatedAt(Instant.now().toString());
        return convertToDTO(repository.save(entity));
    }

    public void deleteGroup(Long id, String userId) {
        ParticipantGroup entity = repository.findById(id)
                .orElseThrow(() -> new GroupNotFoundException("Group not found with id " + id));

        if (!entity.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Only the creator can delete the group");
        }
        repository.delete(entity);
    }

    public ParticipantGroupDTO shareGroup(Long id, List<String> userIdsToShareWith, String ownerId) {
        ParticipantGroup entity = repository.findById(id)
                .orElseThrow(() -> new GroupNotFoundException("Group not found with id " + id));

        if (!entity.getCreatedBy().equals(ownerId)) {
            throw new RuntimeException("Only the creator can share the group");
        }

        entity.setSharedWith(toJson(userIdsToShareWith));
        entity.setUpdatedAt(Instant.now().toString());
        return convertToDTO(repository.save(entity));
    }

    private ParticipantGroupDTO convertToDTO(ParticipantGroup entity) {
        ParticipantGroupDTO dto = new ParticipantGroupDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setParticipantIds(fromJson(entity.getParticipantIds()));
        dto.setSharedWith(fromJson(entity.getSharedWith()));
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    private String toJson(List<String> list) {
        if (list == null) return "[]";
        try {
            return mapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isEmpty()) return new ArrayList<>();
        try {
            return mapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }
}
