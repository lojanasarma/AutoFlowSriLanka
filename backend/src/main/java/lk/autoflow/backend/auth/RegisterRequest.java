package lk.autoflow.backend.auth;

import lombok.Data;

@Data
public class RegisterRequest {
    private String fullName;
    private String email;
    private String mobile;
    private String passwordHash; // the raw password sent by frontend
    private String role;
    private String adminAccessCode;
}
