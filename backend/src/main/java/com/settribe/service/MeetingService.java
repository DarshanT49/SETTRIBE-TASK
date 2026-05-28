package com.settribe.service;

import com.settribe.entity.Meeting;
import com.settribe.repository.MeetingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import com.settribe.dto.MeetingDTO;
import com.settribe.mapper.MeetingMapper;
import java.util.Optional;

@Service
public class MeetingService {

    @Autowired
    private MeetingRepository repository;

    public List<MeetingDTO> findAll() {
        return repository.findAll().stream().map(MeetingMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<MeetingDTO> findById(String id) {
        return repository.findById(id).map(MeetingMapper::toDTO);
    }

    public MeetingDTO save(MeetingDTO dto) {
        Meeting entity = MeetingMapper.toEntity(dto);
        return MeetingMapper.toDTO(repository.save(entity));
    }

    public MeetingDTO update(String id, MeetingDTO dto) {
        if(repository.existsById(id)) {
            Meeting entity = com.settribe.mapper.MeetingMapper.toEntity(dto);
            entity.setId(id);
            return com.settribe.mapper.MeetingMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }
}
