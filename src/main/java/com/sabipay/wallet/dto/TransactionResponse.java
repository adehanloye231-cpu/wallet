package com.sabipay.wallet.dto;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class TransactionResponse {

    private Long id;
    private String type;
    private String title;
    private Long amountMinor;
    private String amountFormatted;
    private String reference;
    private String details;
    private String status;
    private String dateFormatted;

    public TransactionResponse() {
    }

    public TransactionResponse(Long id, String type, String title, Long amountMinor, String reference, String details, String status, LocalDateTime createdAt) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.amountMinor = amountMinor;
        this.amountFormatted = formatMoney(amountMinor);
        this.reference = reference;
        this.details = details;
        this.status = status;
        this.dateFormatted = createdAt != null
                ? createdAt.format(DateTimeFormatter.ofPattern("d MMM, HH:mm"))
                : "";
    }

    private String formatMoney(Long amountMinor) {
        if (amountMinor == null) return "₦0.00";
        double amount = amountMinor / 100.0;
        return String.format("₦%,.2f", amount);
    }

    public Long getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public Long getAmountMinor() {
        return amountMinor;
    }

    public String getAmountFormatted() {
        return amountFormatted;
    }

    public String getReference() {
        return reference;
    }

    public String getDetails() {
        return details;
    }

    public String getStatus() {
        return status;
    }

    public String getDateFormatted() {
        return dateFormatted;
    }
}
