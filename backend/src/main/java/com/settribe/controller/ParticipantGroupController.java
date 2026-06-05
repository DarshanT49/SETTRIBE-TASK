package com.settribe.controller;

import com.settribe.dto.ParticipantGroupDTO;
import com.settribe.service.ParticipantGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class ParticipantGroupController {

    @Autowired
    private ParticipantGroupService service;

    @GetMapping
    public ResponseEntity<List<ParticipantGroupDTO>> getGroups(@RequestHeader("userId") String userId) {
        return ResponseEntity.ok(service.getGroupsForUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ParticipantGroupDTO> getGroup(@PathVariable Long id, @RequestHeader("userId") String userId) {
        return ResponseEntity.ok(service.getGroupForUser(id, userId));
    }

    @PostMapping
    public ResponseEntity<ParticipantGroupDTO> createGroup(@RequestHeader("userId") String userId, @RequestBody ParticipantGroupDTO dto) {
        return ResponseEntity.ok(service.createGroup(dto, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ParticipantGroupDTO> updateGroup(@PathVariable Long id, @RequestHeader("userId") String userId, @RequestBody ParticipantGroupDTO dto) {
        return ResponseEntity.ok(service.updateGroup(id, dto, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id, @RequestHeader("userId") String userId) {
        service.deleteGroup(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<ParticipantGroupDTO> shareGroup(@PathVariable Long id, @RequestHeader("userId") String userId, @RequestBody List<String> userIdsToShareWith) {
        return ResponseEntity.ok(service.shareGroup(id, userIdsToShareWith, userId));
    }
}
