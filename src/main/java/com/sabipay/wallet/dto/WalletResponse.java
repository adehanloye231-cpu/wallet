package com.sabipay.wallet.dto;

public class WalletResponse {

    private Long walletId;
    private String currency;
    private Long balanceMinor;
    private String balanceFormatted;

    public WalletResponse(Long walletId, String currency, Long balanceMinor) {
        this.walletId = walletId;
        this.currency = currency;
        this.balanceMinor = balanceMinor;
        this.balanceFormatted = formatBalance(balanceMinor);
    }

    private String formatBalance(Long balanceMinor) {
        double amount = balanceMinor / 100.0;
        return String.format("₦%,.2f", amount);
    }

    public Long getWalletId() {
        return walletId;
    }

    public String getCurrency() {
        return currency;
    }

    public Long getBalanceMinor() {
        return balanceMinor;
    }

    public String getBalanceFormatted() {
        return balanceFormatted;
    }
}