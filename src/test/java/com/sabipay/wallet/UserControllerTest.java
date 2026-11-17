package com.sabipay.wallet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.sabipay.wallet.controller.UserController;
import com.sabipay.wallet.dto.FundRequest;
import com.sabipay.wallet.dto.PinRequest;
import com.sabipay.wallet.dto.WalletResponse;
import com.sabipay.wallet.entity.User;
import com.sabipay.wallet.entity.Wallet;
import com.sabipay.wallet.repository.WalletRepository;
import com.sabipay.wallet.service.UserService;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private WalletRepository walletRepository;

    private UserController userController;

    private User sampleUser;
    private Wallet sampleWallet;

    @BeforeEach
    void setUp() {
        userController = new UserController(userService, walletRepository);
        sampleUser = new User("Goodluck", "goodluck@example.com", "secret123");
        sampleWallet = new Wallet(sampleUser);
        sampleWallet.setBalanceMinor(10000L); // 100 Naira initial
    }

    @Test
    void testFundWalletWithIntegerAmount() {
        when(walletRepository.findByUser_Id(1L)).thenReturn(Optional.of(sampleWallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FundRequest request = new FundRequest(new BigDecimal("500"));
        WalletResponse response = userController.fundWallet(1L, request);

        // 10000 + 50000 = 60000 kobo
        assertEquals(60000L, response.getBalanceMinor());
        assertEquals("₦600.00", response.getBalanceFormatted());
    }

    @Test
    void testFundWalletWithDecimalAmount() {
        when(walletRepository.findByUser_Id(1L)).thenReturn(Optional.of(sampleWallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FundRequest request = new FundRequest(new BigDecimal("250.75"));
        WalletResponse response = userController.fundWallet(1L, request);

        // 10000 + 25075 = 35075 kobo
        assertEquals(35075L, response.getBalanceMinor());
        assertEquals("₦350.75", response.getBalanceFormatted());
    }

    @Test
    void testFundWalletWithAmountInKobo() {
        when(walletRepository.findByUser_Id(1L)).thenReturn(Optional.of(sampleWallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FundRequest request = new FundRequest();
        request.setAmountInKobo(5000L);
        WalletResponse response = userController.fundWallet(1L, request);

        // 10000 + 5000 = 15000 kobo
        assertEquals(15000L, response.getBalanceMinor());
        assertEquals("₦150.00", response.getBalanceFormatted());
    }

    @Test
    void testFundWalletMissingAmountThrowsBadRequest() {
        FundRequest request = new FundRequest();
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            userController.fundWallet(1L, request);
        });

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Amount is required", ex.getReason());
    }

    @Test
    void testFundWalletNegativeAmountThrowsBadRequest() {
        FundRequest request = new FundRequest(new BigDecimal("-100"));
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            userController.fundWallet(1L, request);
        });

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Amount must be greater than zero", ex.getReason());
    }

    @Test
    void testFundWalletZeroAmountThrowsBadRequest() {
        FundRequest request = new FundRequest(BigDecimal.ZERO);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            userController.fundWallet(1L, request);
        });

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Amount must be greater than zero", ex.getReason());
    }

    @Test
    void testFundWalletUserNotFoundThrowsNotFound() {
        when(walletRepository.findByUser_Id(999L)).thenReturn(Optional.empty());

        FundRequest request = new FundRequest(new BigDecimal("500"));
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            userController.fundWallet(999L, request);
        });

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void testSetAndVerifyPin() {
        doNothing().when(userService).setPin(1L, "1234");
        when(userService.verifyPin(1L, "1234")).thenReturn(true);

        Map<String, Object> setRes = userController.setPin(1L, new PinRequest("1234"));
        assertEquals(true, setRes.get("success"));

        Map<String, Object> verifyRes = userController.verifyPin(1L, new PinRequest("1234"));
        assertEquals(true, verifyRes.get("valid"));
    }

    @Test
    void testDebitWalletSuccess() {
        when(userService.verifyPin(1L, "1234")).thenReturn(true);
        when(walletRepository.findByUser_Id(1L)).thenReturn(Optional.of(sampleWallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // 10000 kobo (₦100) - ₦50 = 5000 kobo (₦50)
        Map<String, Object> req = Map.of("amount", 50, "pin", "1234");
        WalletResponse res = userController.debitWallet(1L, req);

        assertEquals(5000L, res.getBalanceMinor());
        assertEquals("₦50.00", res.getBalanceFormatted());
    }
}
