package com.sabipay.wallet.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String currency = "NGN";

    @Column(nullable = false)
    private Long balanceMinor = 0L;

    public Wallet() {
    }

    public Wallet(User user) {
        this.user = user;
        this.currency = "NGN";
        this.balanceMinor = 0L;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Long getBalanceMinor() {
        return balanceMinor;
    }

    public void setBalanceMinor(Long balanceMinor) {
        this.balanceMinor = balanceMinor;
    }
}
