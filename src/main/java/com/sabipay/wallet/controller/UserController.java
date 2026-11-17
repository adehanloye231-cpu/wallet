package com.sabipay.wallet.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.sabipay.wallet.dto.FundRequest;
import com.sabipay.wallet.dto.PinRequest;
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

        if (request == null || request.getEmail() == null || request.getPassword() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required");
        }

        User user = new User(
                request.getName(),
                request.getEmail(),
                request.getPassword(),
                request.getTransactionPin()
        );

        User savedUser = userService.createUser(user);

        return new UserResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getTransactionPin() != null
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

    // ====================== FUND WALLET ======================
    @PostMapping(value = {"/{userId}/wallet/fund", "/{userId}/fund"})
    public WalletResponse fundWallet(@PathVariable Long userId, @RequestBody FundRequest request) {

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        long amountInKobo;

        if (request.getAmount() != null) {
            if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
            }
            // Convert Naira to kobo (e.g. 100.50 Naira = 10050 kobo)
            amountInKobo = request.getAmount()
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(0, RoundingMode.HALF_UP)
                    .longValue();
        } else if (request.getAmountInKobo() != null) {
            if (request.getAmountInKobo() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
            }
            amountInKobo = request.getAmountInKobo();
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount is required");
        }

        Wallet wallet = walletRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Wallet not found for this user"
                ));

        wallet.setBalanceMinor(wallet.getBalanceMinor() + amountInKobo);
        walletRepository.save(wallet);

        return new WalletResponse(
                wallet.getId(),
                wallet.getCurrency(),
                wallet.getBalanceMinor()
        );
    }

    // ====================== TRANSFER / DEBIT WALLET ======================
    @PostMapping(value = {"/{userId}/wallet/transfer", "/{userId}/wallet/debit"})
    public WalletResponse debitWallet(@PathVariable Long userId, @RequestBody Map<String, Object> request) {

        if (request == null || !request.containsKey("amount")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount is required");
        }

        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }

        // Verify PIN if provided
        if (request.containsKey("pin")) {
            String pin = request.get("pin").toString().trim();
            if (!userService.verifyPin(userId, pin)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect transaction PIN");
            }
        }

        long amountInKobo = amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();

        Wallet wallet = walletRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wallet not found for this user"));

        if (wallet.getBalanceMinor() < amountInKobo) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient wallet balance");
        }

        wallet.setBalanceMinor(wallet.getBalanceMinor() - amountInKobo);
        walletRepository.save(wallet);

        return new WalletResponse(
                wallet.getId(),
                wallet.getCurrency(),
                wallet.getBalanceMinor()
        );
    }

    // ====================== SET TRANSACTION PIN ======================
    @PostMapping("/{userId}/pin")
    public Map<String, Object> setPin(@PathVariable Long userId, @RequestBody PinRequest request) {
        if (request == null || request.getPin() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PIN is required");
        }

        userService.setPin(userId, request.getPin().trim());
        return Map.of("success", true, "message", "Transaction PIN set successfully");
    }

    // ====================== VERIFY TRANSACTION PIN ======================
    @PostMapping("/{userId}/pin/verify")
    public Map<String, Object> verifyPin(@PathVariable Long userId, @RequestBody PinRequest request) {
        if (request == null || request.getPin() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PIN is required");
        }

        boolean valid = userService.verifyPin(userId, request.getPin().trim());
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect transaction PIN");
        }

        return Map.of("valid", true, "message", "Transaction PIN verified");
    }

    // ====================== RESET TRANSACTION PIN ======================
    @PostMapping("/{userId}/pin/reset")
    public Map<String, Object> resetPin(@PathVariable Long userId, @RequestBody PinRequest request) {
        if (request == null || request.getCurrentPassword() == null || request.getPin() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password and new PIN are required");
        }

        userService.resetPin(userId, request.getCurrentPassword(), request.getPin().trim());
        return Map.of("success", true, "message", "Transaction PIN reset successfully");
    }
}
