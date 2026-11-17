// =========================================================
// SABIPAY FRONTEND APPLICATION
// =========================================================

// =========================================================
// GET & SAVE CURRENT USER / ACCOUNTS
// =========================================================

function getCurrentUser() {
    return JSON.parse(localStorage.getItem("sabipayCurrentUser"));
}

function saveCurrentUser(user) {
    localStorage.setItem("sabipayCurrentUser", JSON.stringify(user));
}

function getAccounts() {
    return JSON.parse(localStorage.getItem("sabipayAccounts")) || [];
}

function saveAccounts(accounts) {
    localStorage.setItem("sabipayAccounts", JSON.stringify(accounts));
}

// =========================================================
// FORMAT MONEY
// =========================================================

function formatMoney(amount) {
    return "₦" + Number(amount || 0).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// =========================================================
// PASSWORD SHOW / HIDE (EYE TOGGLE)
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    initPasswordToggles();
});

function initPasswordToggles() {
    document.querySelectorAll(".password-toggle").forEach(button => {
        // avoid attaching multiple times
        if (button.dataset.initialized) return;
        button.dataset.initialized = "true";

        button.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = button.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;

            if (input.type === "password") {
                input.type = "text";
                button.textContent = "🙈";
                button.setAttribute("title", "Hide password");
            } else {
                input.type = "password";
                button.textContent = "👁️";
                button.setAttribute("title", "Show password");
            }
        });
    });
}
initPasswordToggles();

// =========================================================
// SIGN UP
// =========================================================

const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        const confirmPassword = document.getElementById("signupConfirm").value;
        const pinInput = document.getElementById("signupPin");
        const pin = pinInput ? pinInput.value.trim() : "";

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        if (pin && !/^\d{4}$/.test(pin)) {
            alert("Transaction PIN must be exactly 4 digits.");
            return;
        }

        // Register with backend API
        fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                transactionPin: pin
            })
        })
        .then(async response => {
            if (!response.ok) {
                let errMsg = "Registration failed";
                try {
                    const errObj = await response.json();
                    errMsg = errObj.message || errObj.detail || errMsg;
                } catch (_) {
                    errMsg = (await response.text()) || errMsg;
                }
                throw new Error(errMsg);
            }
            return response.json();
        })
        .then(savedUser => {
            const newAccount = {
                id: savedUser.id,
                name: savedUser.name,
                email: savedUser.email,
                balance: 0,
                rewardPoints: 2450,
                beneficiaries: [],
                transactions: [],
                hasPin: true
            };

            let accounts = getAccounts();
            accounts.push(newAccount);
            saveAccounts(accounts);
            saveCurrentUser(newAccount);

            alert("Account created successfully!\n\nWelcome to SabiPay, " + name + "!\nYour 4-digit transaction PIN has been saved.");
            window.location.href = "index.html";
        })
        .catch(err => {
            alert("Sign up error: " + err.message);
        });
    });
}

// =========================================================
// LOGIN
// =========================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: password })
        })
        .then(async response => {
            if (!response.ok) {
                let errMsg = "Incorrect email or password.";
                try {
                    const errObj = await response.json();
                    errMsg = errObj.message || errMsg;
                } catch (_) {
                    errMsg = (await response.text()) || errMsg;
                }
                throw new Error(errMsg);
            }
            return response.json();
        })
        .then(data => {
            let accounts = getAccounts();
            let account = accounts.find(
                user => user.id === data.userId || user.email.toLowerCase() === email.toLowerCase()
            );

            if (!account) {
                account = {
                    id: data.userId,
                    name: data.name,
                    email: data.email,
                    balance: 0,
                    rewardPoints: 2450,
                    beneficiaries: [],
                    transactions: [],
                    hasPin: data.hasPin
                };
                accounts.push(account);
            } else {
                account.id = data.userId;
                account.name = data.name;
                account.email = data.email;
                account.hasPin = data.hasPin !== undefined ? data.hasPin : account.hasPin;
            }

            saveAccounts(accounts);
            saveCurrentUser(account);

            alert("Login successful! Welcome back, " + data.name);
            window.location.href = "index.html";
        })
        .catch(err => {
            alert("Login failed: " + err.message);
        });
    });
}

const forgotPasswordLink = document.getElementById("forgotPasswordLink");
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", function(e) {
        e.preventDefault();
        alert("To reset your password, please contact support at support@sabipay.com or call +234-800-SABIPAY.");
    });
}

// =========================================================
// HOME & GLOBAL PROFILE INITIALIZATION
// =========================================================

const currentUser = getCurrentUser();

if (currentUser) {
    // Topbar avatars across pages
    document.querySelectorAll(".avatar, #topbarAvatar, #rewardAvatar, #userAvatar").forEach(el => {
        el.textContent = (currentUser.name || "U").charAt(0).toUpperCase();
    });

    const welcomeName = document.getElementById("welcomeName");
    if (welcomeName) welcomeName.textContent = currentUser.name;

    const profileName = document.getElementById("profileName");
    if (profileName) profileName.textContent = currentUser.name;

    const profileEmail = document.getElementById("profileEmail");
    if (profileEmail) profileEmail.textContent = currentUser.email;

    const profileAvatar = document.getElementById("profileAvatar");
    if (profileAvatar) profileAvatar.textContent = (currentUser.name || "U").charAt(0).toUpperCase();

    // Fetch and sync wallet balance
    const balanceEl = document.getElementById("balance");
    if (balanceEl) {
        balanceEl.textContent = formatMoney(currentUser.balance || 0);

        if (currentUser.id) {
            fetch("/api/users/" + currentUser.id + "/wallet")
                .then(res => res.ok ? res.json() : null)
                .then(wallet => {
                    if (wallet) {
                        balanceEl.textContent = wallet.balanceFormatted || formatMoney(wallet.balanceMinor / 100);
                        currentUser.balance = wallet.balanceMinor / 100;
                        saveCurrentUser(currentUser);
                    }
                })
                .catch(err => console.log("Wallet fetch skipped or offline", err));
        }
    }

    // Render transactions on index.html
    renderTransactions();
}

// Render Recent Transactions (from DB with local fallback)
async function renderTransactions() {
    const list = document.getElementById("transactionList");
    if (!list || !currentUser) return;

    let transactions = [];
    if (currentUser.id) {
        try {
            const res = await fetch("/api/users/" + currentUser.id + "/transactions");
            if (res.ok) {
                transactions = await res.json();
            }
        } catch (_) {}
    }

    if (!transactions || transactions.length === 0) {
        transactions = currentUser.transactions || [];
    }

    if (transactions.length === 0) {
        list.innerHTML = `
            <div class="transaction">
                <span>📭</span>
                <div>
                    <b>No transactions yet</b>
                    <small>Your transactions will appear here</small>
                </div>
            </div>`;
        return;
    }

    list.innerHTML = transactions.slice(0, 8).map(tx => {
        const isCredit = tx.type === "CREDIT" || tx.type === "credit" || tx.type === "Top-up" || tx.type === "Reward";
        const sign = isCredit ? "+" : "-";
        const icon = isCredit ? "💰" : (tx.icon || "💸");
        const color = isCredit ? "#2e7d32" : "#c62828";
        const displayAmount = tx.amountFormatted || formatMoney(tx.amount || (tx.amountMinor / 100));

        return `
            <div class="transaction" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-size:24px;">${icon}</span>
                    <div>
                        <b style="display:block; font-size:14px;">${tx.title || "Transaction"}</b>
                        <small style="color:#777;">${tx.dateFormatted || tx.date || "Recent"}</small>
                    </div>
                </div>
                <div style="font-weight:700; color:${color}; font-size:14px;">
                    ${sign}${displayAmount}
                </div>
            </div>`;
    }).join("");
}

// Add transaction to history
function recordTransaction(tx) {
    if (!currentUser) return;
    if (!Array.isArray(currentUser.transactions)) {
        currentUser.transactions = [];
    }
    currentUser.transactions.unshift({
        id: Date.now(),
        date: new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
        ...tx
    });
    saveCurrentUser(currentUser);
    renderTransactions();
}

// =========================================================
// SEND MONEY MODAL (TRANSFERS)
// =========================================================

const sendMoneyButton = document.getElementById("sendMoneyBtn");
const quickTransferBtn = document.getElementById("quickTransferBtn");
const sendMoneyModal = document.getElementById("sendMoneyModal");
const closeSendMoney = document.getElementById("closeSendMoney");
const transferForm = document.getElementById("transferForm");

function openTransferModal() {
    if (!currentUser) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }
    loadBeneficiaries();
    if (sendMoneyModal) sendMoneyModal.classList.add("active");
}

if (sendMoneyButton) sendMoneyButton.addEventListener("click", openTransferModal);
if (quickTransferBtn) quickTransferBtn.addEventListener("click", (e) => { e.preventDefault(); openTransferModal(); });

// Check URL query param e.g. index.html?action=transfer
if (window.location.search.includes("action=transfer")) {
    openTransferModal();
}

if (closeSendMoney && sendMoneyModal) {
    closeSendMoney.addEventListener("click", () => sendMoneyModal.classList.remove("active"));
}

if (sendMoneyModal) {
    sendMoneyModal.addEventListener("click", (e) => {
        if (e.target === sendMoneyModal) sendMoneyModal.classList.remove("active");
    });
}

function loadBeneficiaries() {
    const select = document.getElementById("beneficiarySelect");
    if (!select || !currentUser) return;

    select.innerHTML = '<option value="">Select a beneficiary</option>';
    (currentUser.beneficiaries || []).forEach(b => {
        const opt = document.createElement("option");
        opt.value = JSON.stringify(b);
        opt.textContent = `${b.name} (${b.bank} - ${b.accountNumber})`;
        select.appendChild(opt);
    });
}

const beneficiarySelect = document.getElementById("beneficiarySelect");
if (beneficiarySelect) {
    beneficiarySelect.addEventListener("change", function () {
        if (!this.value) return;
        try {
            const b = JSON.parse(this.value);
            document.getElementById("bankSelect").value = b.bank;
            document.getElementById("accountNumber").value = b.accountNumber;
            document.getElementById("beneficiaryName").value = b.name;
        } catch (_) {}
    });
}

// Process Bank Transfer
if (transferForm) {
    transferForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!currentUser) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        const bank = document.getElementById("bankSelect").value;
        const accountNumber = document.getElementById("accountNumber").value.trim();
        const beneficiaryName = document.getElementById("beneficiaryName").value.trim();
        const amount = Number(document.getElementById("transferAmount").value);
        const pin = document.getElementById("transferPin") ? document.getElementById("transferPin").value.trim() : "";
        const saveBeneficiary = document.getElementById("saveBeneficiary") ? document.getElementById("saveBeneficiary").checked : false;

        if (!/^\d{10}$/.test(accountNumber)) {
            alert("Account number must contain exactly 10 digits.");
            return;
        }

        if (!amount || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        if (!pin || !/^\d{4}$/.test(pin)) {
            alert("Please enter your valid 4-digit transaction PIN.");
            return;
        }

        if (amount > Number(currentUser.balance || 0)) {
            alert("Insufficient balance. Please fund your wallet first.");
            return;
        }

        // Call backend to verify PIN and debit wallet
        try {
            const response = await fetch("/api/users/" + currentUser.id + "/wallet/transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: amount, pin: pin })
            });

            if (!response.ok) {
                let errMsg = "Transfer failed";
                try {
                    const err = await response.json();
                    errMsg = err.message || err.detail || errMsg;
                } catch (_) {
                    errMsg = (await response.text()) || errMsg;
                }
                alert(errMsg);
                return;
            }

            const updatedWallet = await response.json();

            // Update local balance
            currentUser.balance = updatedWallet.balanceMinor / 100;
            saveCurrentUser(currentUser);

            const balanceEl = document.getElementById("balance");
            if (balanceEl) {
                balanceEl.textContent = updatedWallet.balanceFormatted || formatMoney(currentUser.balance);
            }

            // Save beneficiary if selected
            if (saveBeneficiary) {
                if (!Array.isArray(currentUser.beneficiaries)) currentUser.beneficiaries = [];
                const exists = currentUser.beneficiaries.some(b => b.accountNumber === accountNumber && b.bank === bank);
                if (!exists) {
                    currentUser.beneficiaries.push({ name: beneficiaryName, bank: bank, accountNumber: accountNumber });
                    saveCurrentUser(currentUser);
                }
            }

            // Record transaction
            recordTransaction({
                type: "debit",
                title: "Transfer to " + beneficiaryName,
                amount: amount,
                icon: "🏦",
                details: `${bank} - ${accountNumber}`
            });

            sendMoneyModal.classList.remove("active");
            transferForm.reset();

            alert(`Transfer Successful!\n\nAmount: ${formatMoney(amount)}\nBeneficiary: ${beneficiaryName} (${bank})\nNew Balance: ${updatedWallet.balanceFormatted}`);
        } catch (err) {
            alert("Network error: " + err.message);
        }
    });
}

// =========================================================
// FUND WALLET / ADD MONEY MODAL
// =========================================================

const addMoneyBtn = document.getElementById("addMoneyBtn");
const addMoneyModal = document.getElementById("addMoneyModal");
const closeAddMoney = document.getElementById("closeAddMoney");
const fundWalletForm = document.getElementById("fundWalletForm");

if (addMoneyBtn && addMoneyModal) {
    addMoneyBtn.addEventListener("click", function () {
        if (!currentUser) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }
        addMoneyModal.classList.add("active");
    });
}

if (closeAddMoney && addMoneyModal) {
    closeAddMoney.addEventListener("click", () => addMoneyModal.classList.remove("active"));
}

if (addMoneyModal) {
    addMoneyModal.addEventListener("click", (e) => {
        if (e.target === addMoneyModal) addMoneyModal.classList.remove("active");
    });
}

if (fundWalletForm) {
    fundWalletForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!currentUser || !currentUser.id) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        const fundAmountInput = document.getElementById("fundAmount");
        const amount = parseFloat(fundAmountInput.value);

        if (!amount || amount <= 0) {
            alert("Please enter a valid amount greater than zero.");
            return;
        }

        fetch("/api/users/" + currentUser.id + "/wallet/fund", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: amount })
        })
        .then(async response => {
            if (!response.ok) {
                let errMsg = "Funding failed";
                try {
                    const errObj = await response.json();
                    errMsg = errObj.message || errObj.detail || errMsg;
                } catch (_) {
                    errMsg = (await response.text()) || errMsg;
                }
                throw new Error(errMsg);
            }
            return response.json();
        })
        .then(wallet => {
            const balanceEl = document.getElementById("balance");
            if (balanceEl) {
                balanceEl.textContent = wallet.balanceFormatted || formatMoney(wallet.balanceMinor / 100);
            }
            currentUser.balance = wallet.balanceMinor / 100;
            saveCurrentUser(currentUser);

            recordTransaction({
                type: "credit",
                title: "Wallet Top-up",
                amount: amount,
                icon: "💳"
            });

            addMoneyModal.classList.remove("active");
            fundAmountInput.value = "";
            alert("Success! Your wallet has been funded with " + formatMoney(amount));
        })
        .catch(err => {
            alert("Error funding wallet: " + err.message);
        });
    });
}

// =========================================================
// FORGOT & RESET TRANSACTION PIN
// =========================================================

const forgotPinLink = document.getElementById("forgotPinLink");
const resetPinModal = document.getElementById("resetPinModal");
const closeResetPin = document.getElementById("closeResetPin");
const resetPinForm = document.getElementById("resetPinForm");

if (forgotPinLink && resetPinModal) {
    forgotPinLink.addEventListener("click", function (e) {
        e.preventDefault();
        if (sendMoneyModal) sendMoneyModal.classList.remove("active");
        resetPinModal.classList.add("active");
    });
}

if (closeResetPin && resetPinModal) {
    closeResetPin.addEventListener("click", () => resetPinModal.classList.remove("active"));
}

if (resetPinModal) {
    resetPinModal.addEventListener("click", (e) => {
        if (e.target === resetPinModal) resetPinModal.classList.remove("active");
    });
}

if (resetPinForm) {
    resetPinForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (!currentUser || !currentUser.id) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        const password = document.getElementById("resetPassword").value;
        const newPin = document.getElementById("newPin").value.trim();

        if (!/^\d{4}$/.test(newPin)) {
            alert("New PIN must be exactly 4 digits.");
            return;
        }

        try {
            const res = await fetch("/api/users/" + currentUser.id + "/pin/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: password, pin: newPin })
            });

            if (!res.ok) {
                let errMsg = "PIN reset failed";
                try {
                    const err = await res.json();
                    errMsg = err.message || errMsg;
                } catch (_) {
                    errMsg = (await res.text()) || errMsg;
                }
                alert(errMsg);
                return;
            }

            currentUser.hasPin = true;
            saveCurrentUser(currentUser);
            resetPinModal.classList.remove("active");
            resetPinForm.reset();
            alert("Your 4-digit transaction PIN has been reset successfully! You can now use your new PIN for transfers.");
        } catch (err) {
            alert("Error resetting PIN: " + err.message);
        }
    });
}

// =========================================================
// SERVICES SECTION (service.html)
// =========================================================

const serviceModal = document.getElementById("serviceModal");
const closeServiceModal = document.getElementById("closeServiceModal");
const serviceForm = document.getElementById("serviceForm");
const serviceModalTitle = document.getElementById("serviceModalTitle");
const serviceModalSubtitle = document.getElementById("serviceModalSubtitle");
const serviceFieldsContainer = document.getElementById("serviceFieldsContainer");
const serviceSubmitBtn = document.getElementById("serviceSubmitBtn");

let currentActiveService = null;

const serviceDefinitions = {
    airtime: {
        title: "Buy Airtime",
        subtitle: "Instant recharge to any Nigerian mobile network",
        btnText: "Purchase Airtime",
        icon: "📱",
        fields: `
            <label>Select Network</label>
            <select id="srvNetwork" required>
                <option value="MTN">MTN</option>
                <option value="Airtel">Airtel</option>
                <option value="Glo">Glo</option>
                <option value="9mobile">9mobile</option>
            </select>
            <label>Phone Number</label>
            <input id="srvPhone" type="tel" maxlength="11" placeholder="e.g. 08012345678" required>
            <label>Amount (₦)</label>
            <input id="srvAmount" type="number" min="50" step="50" placeholder="e.g. 500" required>
        `
    },
    data: {
        title: "Purchase Data Bundle",
        subtitle: "High-speed internet data bundles",
        btnText: "Buy Data",
        icon: "🌐",
        fields: `
            <label>Select Network</label>
            <select id="srvNetwork" required>
                <option value="MTN">MTN</option>
                <option value="Airtel">Airtel</option>
                <option value="Glo">Glo</option>
                <option value="9mobile">9mobile</option>
            </select>
            <label>Choose Bundle</label>
            <select id="srvDataPlan" required>
                <option value="350">1GB Monthly - ₦350</option>
                <option value="600">2.5GB Monthly - ₦600</option>
                <option value="1200">5GB Monthly - ₦1,200</option>
                <option value="2500">10GB Monthly - ₦2,500</option>
            </select>
            <label>Phone Number</label>
            <input id="srvPhone" type="tel" maxlength="11" placeholder="e.g. 08012345678" required>
        `
    },
    bills: {
        title: "Pay Bills & Utilities",
        subtitle: "Electricity, Water and Cable TV tokens",
        btnText: "Pay Bill",
        icon: "💡",
        fields: `
            <label>Select Biller</label>
            <select id="srvBiller" required>
                <option value="IKEDC (Ikeja Electric)">IKEDC (Ikeja Electric)</option>
                <option value="EKEDC (Eko Electric)">EKEDC (Eko Electric)</option>
                <option value="AEDC (Abuja Electric)">AEDC (Abuja Electric)</option>
                <option value="IBEDC (Ibadan Electric)">IBEDC (Ibadan Electric)</option>
                <option value="DStv / GOtv">DStv / GOtv</option>
            </select>
            <label>Meter / Account Number</label>
            <input id="srvAccount" type="text" placeholder="Enter meter or IUC number" required>
            <label>Amount (₦)</label>
            <input id="srvAmount" type="number" min="500" step="100" placeholder="e.g. 3000" required>
        `
    },
    betting: {
        title: "Fund Betting Wallet",
        subtitle: "Instant credit to your favorite sports book",
        btnText: "Fund Betting Account",
        icon: "🎰",
        fields: `
            <label>Select Platform</label>
            <select id="srvPlatform" required>
                <option value="SportyBet">SportyBet</option>
                <option value="Bet9ja">Bet9ja</option>
                <option value="1xBet">1xBet</option>
                <option value="BangBet">BangBet</option>
            </select>
            <label>User ID / Account ID</label>
            <input id="srvBetId" type="text" placeholder="Enter your player user ID" required>
            <label>Amount (₦)</label>
            <input id="srvAmount" type="number" min="100" step="50" placeholder="e.g. 1000" required>
        `
    },
    invest: {
        title: "SabiPay Investments",
        subtitle: "High yield savings with up to 18% p.a.",
        btnText: "Start Investment",
        icon: "📈",
        fields: `
            <label>Investment Portfolio</label>
            <select id="srvInvestPlan" required>
                <option value="SabiGrowth (15% p.a.)">SabiGrowth (15% p.a. - Flexible)</option>
                <option value="SabiVault (18% p.a.)">SabiVault (18% p.a. - 6 Months Lock)</option>
                <option value="Dollar Yield (8% USD)">Dollar Yield (8% in USD)</option>
            </select>
            <label>Amount to Invest (₦)</label>
            <input id="srvAmount" type="number" min="1000" step="500" placeholder="e.g. 10000" required>
        `
    },
    loans: {
        title: "Instant SabiPay Loan",
        subtitle: "Low interest, zero collateral required",
        btnText: "Accept Loan Offer",
        icon: "💰",
        fields: `
            <label>Select Loan Package</label>
            <select id="srvLoanType" required>
                <option value="10000">Starter Nano-Credit: ₦10,000</option>
                <option value="25000">Fast Cash: ₦25,000</option>
                <option value="50000">SME Booster: ₦50,000</option>
            </select>
            <label>Repayment Duration</label>
            <select id="srvDuration" required>
                <option value="30">30 Days (3% interest)</option>
                <option value="60">60 Days (5% interest)</option>
                <option value="90">90 Days (7% interest)</option>
            </select>
        `
    }
};

document.querySelectorAll("[data-service]").forEach(item => {
    item.addEventListener("click", function (e) {
        e.preventDefault();
        if (!currentUser) {
            alert("Please login first to access SabiPay services.");
            window.location.href = "login.html";
            return;
        }

        const serviceKey = this.dataset.service;
        const config = serviceDefinitions[serviceKey];
        if (!config || !serviceModal) return;

        currentActiveService = serviceKey;
        serviceModalTitle.textContent = config.title;
        serviceModalSubtitle.textContent = config.subtitle;
        serviceFieldsContainer.innerHTML = config.fields;
        serviceSubmitBtn.textContent = config.btnText;

        serviceModal.classList.add("active");
        initPasswordToggles();
    });
});

if (closeServiceModal && serviceModal) {
    closeServiceModal.addEventListener("click", () => serviceModal.classList.remove("active"));
}

if (serviceModal) {
    serviceModal.addEventListener("click", (e) => {
        if (e.target === serviceModal) serviceModal.classList.remove("active");
    });
}

// Handle Service Form Submission
if (serviceForm) {
    serviceForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (!currentUser) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        const pin = document.getElementById("servicePin").value.trim();
        if (!pin || !/^\d{4}$/.test(pin)) {
            alert("Please enter your valid 4-digit transaction PIN.");
            return;
        }

        const config = serviceDefinitions[currentActiveService];
        if (!config) return;

        let amount = 0;
        let details = "";
        let isLoan = currentActiveService === "loans";

        if (currentActiveService === "airtime") {
            amount = Number(document.getElementById("srvAmount").value);
            const net = document.getElementById("srvNetwork").value;
            const phone = document.getElementById("srvPhone").value;
            details = `${net} Airtime to ${phone}`;
        } else if (currentActiveService === "data") {
            amount = Number(document.getElementById("srvDataPlan").value);
            const net = document.getElementById("srvNetwork").value;
            const phone = document.getElementById("srvPhone").value;
            details = `${net} Data Bundle to ${phone}`;
        } else if (currentActiveService === "bills") {
            amount = Number(document.getElementById("srvAmount").value);
            const biller = document.getElementById("srvBiller").value;
            const acct = document.getElementById("srvAccount").value;
            details = `${biller} payment for ${acct}`;
        } else if (currentActiveService === "betting") {
            amount = Number(document.getElementById("srvAmount").value);
            const plat = document.getElementById("srvPlatform").value;
            const betId = document.getElementById("srvBetId").value;
            details = `${plat} top-up for ID: ${betId}`;
        } else if (currentActiveService === "invest") {
            amount = Number(document.getElementById("srvAmount").value);
            const plan = document.getElementById("srvInvestPlan").value;
            details = `Investment into ${plan}`;
        } else if (currentActiveService === "loans") {
            amount = Number(document.getElementById("srvLoanType").value);
            const dur = document.getElementById("srvDuration").value;
            details = `Loan of ${formatMoney(amount)} disbursed (${dur} days term)`;
        }

        if (!isLoan && amount > Number(currentUser.balance || 0)) {
            alert("Insufficient balance. Please fund your wallet first to complete this service.");
            return;
        }

        try {
            // Loans credit wallet; other services debit wallet
            const endpoint = isLoan
                ? "/api/users/" + currentUser.id + "/wallet/fund"
                : "/api/users/" + currentUser.id + "/wallet/transfer";

            const body = isLoan
                ? JSON.stringify({ amount: amount })
                : JSON.stringify({ amount: amount, pin: pin });

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: body
            });

            if (!res.ok) {
                let errMsg = "Service request failed";
                try {
                    const err = await res.json();
                    errMsg = err.message || errMsg;
                } catch (_) {
                    errMsg = (await res.text()) || errMsg;
                }
                alert(errMsg);
                return;
            }

            const updatedWallet = await res.json();
            currentUser.balance = updatedWallet.balanceMinor / 100;

            // 2% Cashback reward points for bills and airtime
            if (currentActiveService === "airtime" || currentActiveService === "bills" || currentActiveService === "data") {
                const cashbackPoints = Math.round(amount * 0.02);
                currentUser.rewardPoints = (currentUser.rewardPoints || 0) + cashbackPoints;
            }

            saveCurrentUser(currentUser);

            recordTransaction({
                type: isLoan ? "credit" : "debit",
                title: config.title,
                amount: amount,
                icon: config.icon,
                details: details
            });

            serviceModal.classList.remove("active");
            serviceForm.reset();

            alert(`Transaction Successful!\n\n${details}\nAmount: ${formatMoney(amount)}\nNew Wallet Balance: ${updatedWallet.balanceFormatted}`);
        } catch (err) {
            alert("Network error: " + err.message);
        }
    });
}

// =========================================================
// REWARDS SECTION (reward.html)
// =========================================================

const rewardPointsDisplay = document.getElementById("rewardPointsDisplay");
const rewardCashValue = document.getElementById("rewardCashValue");
const claimRewardBtn = document.getElementById("claimRewardBtn");
const claimDailyBonusBtn = document.getElementById("claimDailyBonusBtn");
const referFriendBtn = document.getElementById("referFriendBtn");
const cashbackBtn = document.getElementById("cashbackBtn");
const dailyBonusSub = document.getElementById("dailyBonusSub");

function syncRewardDisplay() {
    if (!currentUser) return;
    if (currentUser.rewardPoints === undefined || currentUser.rewardPoints === null) {
        currentUser.rewardPoints = 2450;
        saveCurrentUser(currentUser);
    }

    const pts = Number(currentUser.rewardPoints || 0);
    if (rewardPointsDisplay) rewardPointsDisplay.innerHTML = `${pts.toLocaleString()} <small>pts</small>`;
    if (rewardCashValue) rewardCashValue.textContent = formatMoney(pts);
}

syncRewardDisplay();

// Check if daily bonus claimed today
const todayDateStr = new Date().toDateString();
const lastClaimedBonus = localStorage.getItem("sabipayBonusDate_" + (currentUser ? currentUser.id : ""));

if (claimDailyBonusBtn && lastClaimedBonus === todayDateStr) {
    claimDailyBonusBtn.disabled = true;
    claimDailyBonusBtn.textContent = "Claimed Today ✓";
    claimDailyBonusBtn.style.opacity = "0.6";
    if (dailyBonusSub) dailyBonusSub.textContent = "You have claimed today's +100 bonus!";
}

// Claim Reward & Convert to Wallet Cash
if (claimRewardBtn) {
    claimRewardBtn.addEventListener("click", async function () {
        if (!currentUser) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        const points = Number(currentUser.rewardPoints || 0);
        if (points <= 0) {
            alert("You do not have any reward points to claim yet. Earn points by completing transactions and daily check-ins!");
            return;
        }

        const cashToCredit = points; // 1 point = 1 Naira

        if (!confirm(`Are you sure you want to convert ${points.toLocaleString()} points into ${formatMoney(cashToCredit)} wallet cash?`)) {
            return;
        }

        try {
            claimRewardBtn.disabled = true;
            claimRewardBtn.textContent = "Processing...";

            const res = await fetch("/api/users/" + currentUser.id + "/wallet/fund", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: cashToCredit })
            });

            if (!res.ok) {
                let errMsg = "Failed to convert rewards";
                try {
                    const err = await res.json();
                    errMsg = err.message || errMsg;
                } catch (_) {
                    errMsg = (await res.text()) || errMsg;
                }
                alert(errMsg);
                claimRewardBtn.disabled = false;
                claimRewardBtn.textContent = "Claim Reward to Wallet";
                return;
            }

            const updatedWallet = await res.json();
            currentUser.balance = updatedWallet.balanceMinor / 100;
            currentUser.rewardPoints = 0;
            saveCurrentUser(currentUser);

            recordTransaction({
                type: "credit",
                title: "Reward Points Redeemed",
                amount: cashToCredit,
                icon: "🎁",
                details: `${points.toLocaleString()} points converted to cash`
            });

            syncRewardDisplay();
            claimRewardBtn.disabled = false;
            claimRewardBtn.textContent = "Claim Reward to Wallet";

            alert(`Congratulations! 🎉\n\n${points.toLocaleString()} points were converted to ${formatMoney(cashToCredit)} and credited to your wallet!\n\nNew Wallet Balance: ${updatedWallet.balanceFormatted}`);
        } catch (err) {
            alert("Error claiming rewards: " + err.message);
            claimRewardBtn.disabled = false;
            claimRewardBtn.textContent = "Claim Reward to Wallet";
        }
    });
}

// Daily Login Bonus
if (claimDailyBonusBtn) {
    claimDailyBonusBtn.addEventListener("click", function () {
        if (!currentUser) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        if (localStorage.getItem("sabipayBonusDate_" + currentUser.id) === todayDateStr) {
            alert("You have already claimed your daily bonus today. Come back tomorrow!");
            return;
        }

        currentUser.rewardPoints = (currentUser.rewardPoints || 0) + 100;
        saveCurrentUser(currentUser);
        localStorage.setItem("sabipayBonusDate_" + currentUser.id, todayDateStr);

        syncRewardDisplay();
        claimDailyBonusBtn.disabled = true;
        claimDailyBonusBtn.textContent = "Claimed Today ✓";
        claimDailyBonusBtn.style.opacity = "0.6";
        if (dailyBonusSub) dailyBonusSub.textContent = "You have claimed today's +100 bonus!";

        alert("Daily Login Bonus Claimed! 🎁\n\n+100 reward points added to your account.");
    });
}

// Refer a Friend
if (referFriendBtn) {
    referFriendBtn.addEventListener("click", function () {
        const refUrl = window.location.origin + "/signup.html?ref=" + (currentUser ? currentUser.id : "sabipay");
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(refUrl).then(() => {
                alert("Referral link copied to clipboard!\n\n" + refUrl + "\n\nShare with your friends: earn 500 points when they sign up!");
            }).catch(() => {
                prompt("Copy your referral link:", refUrl);
            });
        } else {
            prompt("Copy your referral link:", refUrl);
        }
    });
}

// Cashback Info
if (cashbackBtn) {
    cashbackBtn.addEventListener("click", function () {
        alert("SabiPay Cashback Program 💳\n\n- Earn 2% instant cashback points on every Airtime and Data recharge.\n- Earn 1% cashback points on Utility Bills and Betting top-ups.\n- Points never expire and can be converted directly into wallet cash anytime!");
    });
}

// =========================================================
// ME / SETTINGS PAGE (me.html)
// =========================================================

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
        if (confirm("Are you sure you want to log out of SabiPay?")) {
            localStorage.removeItem("sabipayCurrentUser");
            window.location.href = "login.html";
        }
    });
}

// =========================================================
// ME / SETTINGS HANDLERS
// =========================================================

const mePersonalInfo = document.getElementById("mePersonalInfo");
const editProfileModal = document.getElementById("editProfileModal");
const closeEditProfile = document.getElementById("closeEditProfile");
const editProfileForm = document.getElementById("editProfileForm");
const mePin = document.getElementById("mePin");
const meAccounts = document.getElementById("meAccounts");
const meNotifications = document.getElementById("meNotifications");
const meSupport = document.getElementById("meSupport");

if (mePersonalInfo && editProfileModal) {
    mePersonalInfo.addEventListener("click", function (e) {
        e.preventDefault();
        if (!currentUser) return;
        document.getElementById("editFullName").value = currentUser.name || "";
        document.getElementById("displayEmail").value = currentUser.email || "";
        editProfileModal.classList.add("active");
    });
}

if (closeEditProfile && editProfileModal) {
    closeEditProfile.addEventListener("click", () => editProfileModal.classList.remove("active"));
}

if (editProfileModal) {
    editProfileModal.addEventListener("click", (e) => {
        if (e.target === editProfileModal) editProfileModal.classList.remove("active");
    });
}

if (editProfileForm) {
    editProfileForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const newName = document.getElementById("editFullName").value.trim();
        if (!newName) return;

        try {
            const res = await fetch("/api/users/" + currentUser.id + "/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                const updated = await res.json();
                currentUser.name = updated.name;
                saveCurrentUser(currentUser);

                const profileName = document.getElementById("profileName");
                if (profileName) profileName.textContent = updated.name;
                document.querySelectorAll(".avatar, #profileAvatar").forEach(el => {
                    el.textContent = updated.name.charAt(0).toUpperCase();
                });

                editProfileModal.classList.remove("active");
                alert("Profile name updated successfully!");
            }
        } catch (err) {
            alert("Error updating profile: " + err.message);
        }
    });
}

if (mePin && resetPinModal) {
    mePin.addEventListener("click", function (e) {
        e.preventDefault();
        resetPinModal.classList.add("active");
    });
}

if (meAccounts) {
    meAccounts.addEventListener("click", function (e) {
        e.preventDefault();
        const beneficiaries = currentUser ? (currentUser.beneficiaries || []) : [];
        if (beneficiaries.length === 0) {
            alert("You have no saved bank accounts yet. Saved accounts from transfers will appear here.");
        } else {
            const listStr = beneficiaries.map((b, i) => `${i + 1}. ${b.name} - ${b.bank} (${b.accountNumber})`).join("\n");
            alert("Saved Bank Accounts:\n\n" + listStr);
        }
    });
}

if (meNotifications) {
    meNotifications.addEventListener("click", function (e) {
        e.preventDefault();
        alert("SabiPay Notifications 🔔\n\n- Instant transaction SMS alerts: Active\n- In-App payment notifications: Active\n- Login security alerts: Active");
    });
}

if (meSupport) {
    meSupport.addEventListener("click", function (e) {
        e.preventDefault();
        alert("SabiPay Help & Customer Support ❓\n\nEmail: support@sabipay.com\nPhone: +234-800-SABIPAY (0800 7224 729)\nWhatsApp: +234 812 345 6789\n\nWe are available 24/7 to help you!");
    });
}
