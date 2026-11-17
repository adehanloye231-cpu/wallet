package com.sabipay.wallet.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.sabipay.wallet.entity.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUser_IdOrderByCreatedAtDesc(Long userId);

}
