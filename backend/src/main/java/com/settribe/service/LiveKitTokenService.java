package com.settribe.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Service
public class LiveKitTokenService {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${livekit.url:ws://localhost:7880}")
    private String liveKitUrl;

    @Value("${livekit.api-key:devkey}")
    private String apiKey;

    @Value("${livekit.api-secret:secret}")
    private String apiSecret;

    public String getLiveKitUrl() {
        return liveKitUrl;
    }

    public String createJoinToken(String roomName, String userId, String displayName) {
        long now = Instant.now().getEpochSecond();
        Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
        Map<String, Object> videoGrant = Map.of(
                "roomJoin", true,
                "room", roomName,
                "canPublish", true,
                "canSubscribe", true,
                "canPublishData", true
        );
        Map<String, Object> claims = Map.of(
                "iss", apiKey,
                "sub", userId,
                "name", displayName == null || displayName.isBlank() ? userId : displayName,
                "nbf", now,
                "exp", now + 7200,
                "video", videoGrant
        );

        String unsignedToken = base64UrlJson(header) + "." + base64UrlJson(claims);
        return unsignedToken + "." + sign(unsignedToken);
    }

    private String base64UrlJson(Object value) {
        try {
            byte[] json = objectMapper.writeValueAsBytes(value);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(json);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to encode LiveKit token payload", e);
        }
    }

    private String sign(String unsignedToken) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec(apiSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] signature = hmac.doFinal(unsignedToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to sign LiveKit token", e);
        }
    }
}
