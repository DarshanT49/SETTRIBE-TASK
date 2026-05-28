package com.settribe.mapper;

import com.settribe.dto.SelfTaskDTO;
import com.settribe.entity.SelfTask;

public class SelfTaskMapper {
    public static SelfTaskDTO toDTO(SelfTask e) {
        if (e == null) return null;
        SelfTaskDTO d = new SelfTaskDTO();
        d.setId(e.getId());
        d.setUserId(e.getUserId());
        d.setTitle(e.getTitle());
        d.setDescription(e.getDescription());
        d.setPriority(e.getPriority());
        d.setStatus(e.getStatus());
        d.setDate(e.getDate());
        d.setTime(e.getTime());
        d.setReminder(e.getReminder());
        d.setReminderOffset(e.getReminderOffset());
        d.setCreatedAt(e.getCreatedAt());
        return d;
    }

    public static SelfTask toEntity(SelfTaskDTO d) {
        if (d == null) return null;
        SelfTask e = new SelfTask();
        e.setId(d.getId());
        e.setUserId(d.getUserId());
        e.setTitle(d.getTitle());
        e.setDescription(d.getDescription());
        e.setPriority(d.getPriority());
        e.setStatus(d.getStatus());
        e.setDate(d.getDate());
        e.setTime(d.getTime());
        e.setReminder(d.getReminder());
        e.setReminderOffset(d.getReminderOffset());
        e.setCreatedAt(d.getCreatedAt());
        return e;
    }
}
