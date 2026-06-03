package com.settribe.controller;

import com.settribe.entity.ProjectChatMessage;
import com.settribe.repository.ProjectChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.time.Instant;

@RestController

public class ChatController {

    @Autowired
    private ProjectChatMessageRepository chatMessageRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("/api/projects/{projectId}/chat")
    public List<ProjectChatMessage> getChatHistory(@PathVariable String projectId) {
        return chatMessageRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
    }

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ProjectChatMessage chatMessage) {
        if (chatMessage.getId() == null || chatMessage.getId().isEmpty()) {
            chatMessage.setId(UUID.randomUUID().toString());
        }
        if (chatMessage.getCreatedAt() == null || chatMessage.getCreatedAt().isEmpty()) {
            chatMessage.setCreatedAt(Instant.now().toString());
        }
        chatMessageRepository.save(chatMessage);
        
        messagingTemplate.convertAndSend("/topic/project/" + chatMessage.getProjectId(), chatMessage);
    }
}
