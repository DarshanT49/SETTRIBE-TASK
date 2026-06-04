package com.settribe.repository;

import com.settribe.entity.ParticipantGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParticipantGroupRepository extends JpaRepository<ParticipantGroup, Long> {
    List<ParticipantGroup> findByCreatedBy(String createdBy);

    @Query("SELECT g FROM ParticipantGroup g WHERE g.sharedWith LIKE CONCAT('%', :userId, '%')")
    List<ParticipantGroup> findBySharedWithContaining(@Param("userId") String userId);
}
