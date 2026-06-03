package com.settribe.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.settribe.entity.ChatMessage;
import com.settribe.repository.ChatMessageRepository;
import com.settribe.dto.ChatMessageDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatMessageService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {};

    @Autowired
    private ChatMessageRepository repository;

    public List<ChatMessageDTO> findByMeetingId(String meetingId) {
        return repository.findByMeetingIdOrderByTimestampAsc(meetingId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageDTO save(ChatMessageDTO dto) {
        ChatMessage entity = toEntity(dto);
        ChatMessage saved = repository.save(entity);
        return toDTO(saved);
    }

    @Transactional
    public void deleteByMeetingId(String meetingId) {
        repository.deleteByMeetingId(meetingId);
    }

    private ChatMessageDTO toDTO(ChatMessage entity) {
        return new ChatMessageDTO(
                entity.getId(),
                entity.getMeetingId(),
                entity.getUserId(),
                entity.getSenderId(),
                entity.getText(),
                parseMentions(entity.getMentions()),
                entity.getTimestamp()
        );
    }

    private ChatMessage toEntity(ChatMessageDTO dto) {
        return new ChatMessage(
                dto.getId(),
                dto.getMeetingId(),
                dto.getUserId(),
                dto.getSenderId(),
                dto.getText(),
                serializeMentions(dto.getMentions()),
                dto.getTimestamp()
        );
    }

    private List<String> parseMentions(String value) {
        if (value == null || value.isBlank()) {
            return new ArrayList<>();
        }
        try {
            List<String> parsed = OBJECT_MAPPER.readValue(value, STRING_LIST_TYPE);
            return parsed == null ? new ArrayList<>() : parsed;
        } catch (Exception ignored) {
            return new ArrayList<>();
        }
    }

    private String serializeMentions(List<String> mentions) {
        try {
            return OBJECT_MAPPER.writeValueAsString(mentions == null ? new ArrayList<>() : mentions);
        } catch (Exception ignored) {
            return "[]";
        }
    }
}
