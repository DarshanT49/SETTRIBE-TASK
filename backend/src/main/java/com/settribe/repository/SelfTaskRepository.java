package com.settribe.repository;

import com.settribe.entity.SelfTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SelfTaskRepository extends JpaRepository<SelfTask, String> {
}
