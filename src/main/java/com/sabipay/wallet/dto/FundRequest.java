package com.sabipay.wallet.dto;

import java.math.BigDecimal;

public class FundRequest {

    private BigDecimal amount;
    private Long amountInKobo;

    public FundRequest() {
    }

    public FundRequest(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Long getAmountInKobo() {
        return amountInKobo;
    }

    public void setAmountInKobo(Long amountInKobo) {
        this.amountInKobo = amountInKobo;
    }
}
