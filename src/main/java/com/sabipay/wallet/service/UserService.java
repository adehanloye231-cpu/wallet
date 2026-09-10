package com.sabipay.wallet.service;

import com.sabipay.wallet.entity.User;
import com.sabipay.wallet.entity.Wallet;
import com.sabipay.wallet.repository.UserRepository;
import com.sabipay.wallet.repository.WalletRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

    public User createUser(User user) {

        // Hash the password before saving it
        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        // Save the user
        User savedUser = userRepository.save(user);

        // Create a wallet for the new user
        Wallet wallet = new Wallet(savedUser);

        // Save the wallet
        walletRepository.save(wallet);

        return savedUser;
    }
}