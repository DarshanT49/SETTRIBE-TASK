package com.settribe.service;

import com.settribe.entity.ChatMessage;
import com.settribe.repository.ChatMessageRepository;
import com.settribe.dto.ChatMessageDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatMessageService {

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
                dto.getTimestamp()
        );
    }
}
