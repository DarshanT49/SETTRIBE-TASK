package com.settribe.service;

import com.settribe.entity.RegistrationRequest;
import com.settribe.repository.RegistrationRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.settribe.dto.RegistrationRequestDTO;
import com.settribe.mapper.RegistrationRequestMapper;

@Service
public class RegistrationRequestService {
    @Autowired
    private RegistrationRequestRepository repository;

    public List<RegistrationRequestDTO> findAll() {
        return repository.findAll().stream().map(RegistrationRequestMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<RegistrationRequestDTO> findById(String id) {
        return repository.findById(id).map(RegistrationRequestMapper::toDTO);
    }

    public RegistrationRequestDTO save(RegistrationRequestDTO dto) {
        RegistrationRequest entity = RegistrationRequestMapper.toEntity(dto);
        return RegistrationRequestMapper.toDTO(repository.save(entity));
    }

    public RegistrationRequestDTO update(String id, RegistrationRequestDTO dto) {
        if (repository.existsById(id)) {
            RegistrationRequest entity = RegistrationRequestMapper.toEntity(dto);
            entity.setId(id);
            return RegistrationRequestMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }
}
