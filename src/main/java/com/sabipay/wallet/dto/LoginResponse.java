package com.sabipay.wallet.dto;

public class LoginResponse {

    private Long userId;
    private String name;
    private String email;
    private String message;
    private boolean hasPin;

    public LoginResponse(Long userId, String name, String email, String message) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.message = message;
        this.hasPin = false;
    }

    public LoginResponse(Long userId, String name, String email, String message, boolean hasPin) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.message = message;
        this.hasPin = hasPin;
    }

    public Long getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getMessage() {
        return message;
    }

    public boolean isHasPin() {
        return hasPin;
    }
}
