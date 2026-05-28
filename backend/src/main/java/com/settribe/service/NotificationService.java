package com.settribe.service;

import com.settribe.entity.Notification;
import com.settribe.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import com.settribe.dto.NotificationDTO;
import com.settribe.mapper.NotificationMapper;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository repository;

    public List<NotificationDTO> findAll() {
        return repository.findAll().stream().map(NotificationMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<NotificationDTO> findById(String id) {
        return repository.findById(id).map(NotificationMapper::toDTO);
    }

    public NotificationDTO save(NotificationDTO dto) {
        Notification entity = NotificationMapper.toEntity(dto);
        return NotificationMapper.toDTO(repository.save(entity));
    }

    public NotificationDTO update(String id, NotificationDTO dto) {
        if(repository.existsById(id)) {
            Notification entity = com.settribe.mapper.NotificationMapper.toEntity(dto);
            entity.setId(id);
            return com.settribe.mapper.NotificationMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }
}
