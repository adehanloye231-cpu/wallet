package com.sabipay.wallet.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.sabipay.wallet.dto.RegisterRequest;
import com.sabipay.wallet.dto.UserResponse;
import com.sabipay.wallet.dto.WalletResponse;
import com.sabipay.wallet.entity.User;
import com.sabipay.wallet.entity.Wallet;
import com.sabipay.wallet.repository.WalletRepository;
import com.sabipay.wallet.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final WalletRepository walletRepository;

    public UserController(UserService userService, WalletRepository walletRepository) {
        this.userService = userService;
        this.walletRepository = walletRepository;
    }

    // ====================== REGISTER ======================
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@RequestBody RegisterRequest request) {

        User user = new User(
                request.getName(),
                request.getEmail(),
                request.getPassword()
        );

        User savedUser = userService.createUser(user);

        return new UserResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail()
        );
    }

    // ====================== GET WALLET ======================
    @GetMapping("/{userId}/wallet")
    public WalletResponse getWallet(@PathVariable Long userId) {

            Wallet wallet = walletRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Wallet not found for this user"
                ));

        return new WalletResponse(
                wallet.getId(),
                wallet.getCurrency(),
                wallet.getBalanceMinor()
        );
    }
}