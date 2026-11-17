package com.sabipay.wallet.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sabipay.wallet.dto.LoginRequest;
import com.sabipay.wallet.dto.LoginResponse;
import com.sabipay.wallet.entity.User;
import com.sabipay.wallet.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        if (request == null || request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Email and password are required");
        }

        User user = userRepository
                .findByEmail(request.getEmail())
                .orElse(null);

        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password");
        }

        boolean passwordMatches =
                passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                );

        if (!passwordMatches) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password");
        }

        return ResponseEntity.ok(
                new LoginResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        "Login successful",
                        user.getTransactionPin() != null
                )
        );
    }
}
