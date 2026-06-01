package com.settribe.repository;

import com.settribe.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, String> {
    Optional<Interview> findByToken(String token);
}
