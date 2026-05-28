package com.settribe.service;

import com.settribe.entity.MeetingRsvp;
import com.settribe.repository.MeetingRsvpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import com.settribe.dto.MeetingRsvpDTO;
import com.settribe.mapper.MeetingRsvpMapper;
import java.util.Optional;

@Service
public class MeetingRsvpService {

    @Autowired
    private MeetingRsvpRepository repository;

    public List<MeetingRsvpDTO> findAll() {
        return repository.findAll().stream().map(MeetingRsvpMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<MeetingRsvpDTO> findById(String id) {
        return repository.findById(id).map(MeetingRsvpMapper::toDTO);
    }

    public MeetingRsvpDTO save(MeetingRsvpDTO dto) {
        MeetingRsvp entity = MeetingRsvpMapper.toEntity(dto);
        return MeetingRsvpMapper.toDTO(repository.save(entity));
    }

    public MeetingRsvpDTO update(String id, MeetingRsvpDTO dto) {
        if(repository.existsById(id)) {
            MeetingRsvp entity = com.settribe.mapper.MeetingRsvpMapper.toEntity(dto);
            entity.setId(id);
            return com.settribe.mapper.MeetingRsvpMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }
}
