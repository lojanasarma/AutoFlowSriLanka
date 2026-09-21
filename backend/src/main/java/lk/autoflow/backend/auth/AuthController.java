package lk.autoflow.backend.auth;

import lk.autoflow.backend.security.JwtService;
import lk.autoflow.backend.user.User;
import lk.autoflow.backend.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuthController.class);

    @Value("${app.registration.admin-secret:}")
    private String adminRegistrationSecret;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
            );
        } catch (org.springframework.security.authentication.DisabledException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Account is disabled or pending approval");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }

        User user = userRepository.findByEmail(loginRequest.getEmail()).orElseThrow();
        String jwtToken = jwtService.generateToken(user);

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwtToken);
        response.put("user", user);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if ("ADMIN".equals(request.getRole()) && !isValidAdminAccessCode(request.getAdminAccessCode())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("A valid administrator access code is required");
        }
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email is already taken");
        }

        Optional<User> existingMobile = userRepository.findByMobile(request.getMobile());
        if (existingMobile.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Mobile number is already registered");
        }
        
        try {
            User userToSave;
            
            if ("CUSTOMER".equals(request.getRole()) || "USER".equals(request.getRole())) {
                lk.autoflow.backend.user.Customer customer = new lk.autoflow.backend.user.Customer();
                customer.setLoyaltyPoints(0);
                // Customers are automatically active
                customer.setStatus("ACTIVE"); 
                // Ensure their role is set as CUSTOMER
                request.setRole("CUSTOMER");
                userToSave = customer;
            } else if ("ADMIN".equals(request.getRole())) {
                userToSave = new User();
                userToSave.setStatus("ACTIVE");
            } else {
                lk.autoflow.backend.user.Staff staff = new lk.autoflow.backend.user.Staff();
                staff.setDepartment(request.getRole());
                staff.setStatus("PENDING");
                userToSave = staff;
            }

            userToSave.setFullName(request.getFullName());
            userToSave.setEmail(request.getEmail());
            userToSave.setMobile(request.getMobile());
            userToSave.setRole(request.getRole());
            
            // Hash the password before saving!
            userToSave.setPasswordHash(passwordEncoder.encode(request.getPasswordHash()));
            
            User savedUser = userRepository.save(userToSave);
            
            Map<String, Object> response = new HashMap<>();
            response.put("user", savedUser);

            if (!"PENDING".equals(savedUser.getStatus())) {
                // Generate token for auto-login after register
                String jwtToken = jwtService.generateToken(savedUser);
                response.put("token", jwtToken);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            LOGGER.error("Registration failed for email={}", request.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Registration could not be completed");
        }
    }

    private boolean isValidAdminAccessCode(String accessCode) {
        return adminRegistrationSecret != null
                && !adminRegistrationSecret.isBlank()
                && java.security.MessageDigest.isEqual(
                        adminRegistrationSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                        (accessCode == null ? "" : accessCode).getBytes(java.nio.charset.StandardCharsets.UTF_8)
                );
    }
}
