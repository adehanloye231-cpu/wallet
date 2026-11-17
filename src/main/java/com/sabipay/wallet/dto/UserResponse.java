package com.sabipay.wallet.dto;

public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private boolean hasPin;

    public UserResponse(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.hasPin = false;
    }

    public UserResponse(Long id, String name, String email, boolean hasPin) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.hasPin = hasPin;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public boolean isHasPin() {
        return hasPin;
    }
}
