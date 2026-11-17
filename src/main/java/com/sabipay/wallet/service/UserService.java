package com.sabipay.wallet.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sabipay.wallet.entity.User;
import com.sabipay.wallet.entity.Wallet;
import com.sabipay.wallet.repository.UserRepository;
import com.sabipay.wallet.repository.WalletRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            WalletRepository walletRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User createUser(User user) {

        if (user == null || user.getEmail() == null || user.getEmail().isBlank() ||
                user.getPassword() == null || user.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required");
        }

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        // Hash the password before saving it
        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        // Hash the transaction PIN if provided
        if (user.getTransactionPin() != null && !user.getTransactionPin().isBlank()) {
            user.setTransactionPin(passwordEncoder.encode(user.getTransactionPin().trim()));
        }

        // Save the user
        User savedUser = userRepository.save(user);

        // Create a wallet for the new user
        Wallet wallet = new Wallet(savedUser);

        // Save the wallet
        walletRepository.save(wallet);

        return savedUser;
    }

    @Transactional
    public void setPin(Long userId, String pin) {
        if (pin == null || !pin.matches("\\d{4}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PIN must be exactly 4 digits");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setTransactionPin(passwordEncoder.encode(pin));
        userRepository.save(user);
    }

    public boolean verifyPin(Long userId, String pin) {
        if (pin == null || pin.isBlank()) {
            return false;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getTransactionPin() == null) {
            return false;
        }

        return passwordEncoder.matches(pin, user.getTransactionPin());
    }

    @Transactional
    public void resetPin(Long userId, String password, String newPin) {
        if (newPin == null || !newPin.matches("\\d{4}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New PIN must be exactly 4 digits");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid account password");
        }

        user.setTransactionPin(passwordEncoder.encode(newPin));
        userRepository.save(user);
    }
}
