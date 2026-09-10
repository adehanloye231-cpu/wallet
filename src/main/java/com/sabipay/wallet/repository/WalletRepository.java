package com.sabipay.wallet.repository;

import com.sabipay.wallet.entity.Wallet;
import com.sabipay.wallet.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, Long> {

    Optional<Wallet> findByUser(User user);

}
