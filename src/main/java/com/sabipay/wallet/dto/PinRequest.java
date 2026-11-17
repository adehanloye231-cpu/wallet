package com.sabipay.wallet.dto;

public class PinRequest {

    private String pin;
    private String currentPassword;

    public PinRequest() {
    }

    public PinRequest(String pin) {
        this.pin = pin;
    }

    public PinRequest(String pin, String currentPassword) {
        this.pin = pin;
        this.currentPassword = currentPassword;
    }

    public String getPin() {
        return pin;
    }

    public void setPin(String pin) {
        this.pin = pin;
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }
}

