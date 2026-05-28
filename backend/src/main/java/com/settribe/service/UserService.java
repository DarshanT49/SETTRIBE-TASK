package com.settribe.service;
import com.settribe.entity.User;
import com.settribe.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
import com.settribe.dto.UserDTO;
import com.settribe.mapper.UserMapper;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository repository;

    public List<UserDTO> findAll() {
        return repository.findAll().stream().map(UserMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<UserDTO> findById(String id) {
        return repository.findById(id).map(UserMapper::toDTO);
    }

    public UserDTO save(UserDTO dto) {
        User entity = UserMapper.toEntity(dto);
        return UserMapper.toDTO(repository.save(entity));
    }

    public UserDTO update(String id, UserDTO dto) {
        if (repository.existsById(id)) {
            User entity = UserMapper.toEntity(dto);
            entity.setId(id);
            return UserMapper.toDTO(repository.save(entity));
        }
        throw new RuntimeException("Entity not found");
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }

    public UserDTO findByEmail(String email) {
        User u = repository.findByEmail(email);
        return u != null ? UserMapper.toDTO(u) : null;
    }

    public UserDTO findByEmployeeId(String employeeId) {
        User u = repository.findByEmployeeId(employeeId);
        return u != null ? UserMapper.toDTO(u) : null;
    }
}
