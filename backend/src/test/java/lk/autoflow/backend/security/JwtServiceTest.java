package lk.autoflow.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    @Test
    void generatesAndValidatesTokenForUser() {
        JwtService jwtService = new JwtService();
        String secret = Base64.getEncoder().encodeToString(new byte[32]);
        ReflectionTestUtils.setField(jwtService, "secretKey", secret);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 60_000L);
        User user = new User("driver@example.com", "password", java.util.List.of());

        String token = jwtService.generateToken(user);

        assertEquals("driver@example.com", jwtService.extractUsername(token));
        assertTrue(jwtService.isTokenValid(token, user));
    }
}
