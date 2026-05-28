package com.settribe.repository;

import com.settribe.entity.MeetingRsvp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MeetingRsvpRepository extends JpaRepository<MeetingRsvp, String> {
}
