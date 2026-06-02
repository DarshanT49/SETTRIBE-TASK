package com.settribe.repository;

import com.settribe.entity.StandupRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StandupRecordRepository extends JpaRepository<StandupRecord, Long> {
    List<StandupRecord> findByMeetingId(String meetingId);
}
