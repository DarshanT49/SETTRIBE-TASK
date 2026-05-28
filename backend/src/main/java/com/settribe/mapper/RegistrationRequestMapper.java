package com.settribe.mapper;

import com.settribe.dto.RegistrationRequestDTO;
import com.settribe.entity.RegistrationRequest;

public class RegistrationRequestMapper {
    public static RegistrationRequestDTO toDTO(RegistrationRequest e) {
        if (e == null) return null;
        return new RegistrationRequestDTO(e.getId(), e.getUserId(), e.getStatus(), e.getRequestedAt(), e.getReviewedBy(), e.getReviewedAt(), e.getRejectionReason());
    }

    public static RegistrationRequest toEntity(RegistrationRequestDTO d) {
        if (d == null) return null;
        return new RegistrationRequest(d.getId(), d.getUserId(), d.getStatus(), d.getRequestedAt(), d.getReviewedBy(), d.getReviewedAt(), d.getRejectionReason());
    }
}
