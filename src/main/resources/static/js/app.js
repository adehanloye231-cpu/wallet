// =========================================================
// SABIPAY FRONTEND APPLICATION
// =========================================================


// =========================================================
// GET CURRENT USER
// =========================================================

function getCurrentUser() {

    return JSON.parse(
        localStorage.getItem("sabipayCurrentUser")
    );

}


// =========================================================
// SAVE CURRENT USER
// =========================================================

function saveCurrentUser(user) {

    localStorage.setItem(
        "sabipayCurrentUser",
        JSON.stringify(user)
    );

}


// =========================================================
// GET ALL ACCOUNTS
// =========================================================

function getAccounts() {

    return JSON.parse(
        localStorage.getItem("sabipayAccounts")
    ) || [];

}


// =========================================================
// SAVE ALL ACCOUNTS
// =========================================================

function saveAccounts(accounts) {

    localStorage.setItem(
        "sabipayAccounts",
        JSON.stringify(accounts)
    );

}


// =========================================================
// FORMAT MONEY
// =========================================================

function formatMoney(amount) {

    return "₦" +
        Number(amount || 0).toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


// =========================================================
// PASSWORD SHOW / HIDE
// =========================================================

document
    .querySelectorAll(".password-toggle")
    .forEach(button => {

        button.addEventListener("click", () => {

            const input =
                document.getElementById(
                    button.dataset.target
                );


            if (input.type === "password") {

                input.type = "text";

                button.textContent = "Hide";

            } else {

                input.type = "password";

                button.textContent = "Show";

            }

        });

    });


// =========================================================
// SIGN UP
// =========================================================

const signupForm =
    document.getElementById("signupForm");


if (signupForm) {

    signupForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const name =
                document
                    .getElementById("signupName")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("signupEmail")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("signupPassword")
                    .value;


            const confirmPassword =
                document
                    .getElementById("signupConfirm")
                    .value;


            if (password !== confirmPassword) {

                alert(
                    "Passwords do not match."
                );

                return;

            }


            if (password.length < 6) {

                alert(
                    "Password must be at least 6 characters."
                );

                return;

            }


            let accounts =
                getAccounts();


            const existingAccount =
                accounts.find(
                    account =>
                        account.email.toLowerCase() ===
                        email.toLowerCase()
                );


            if (existingAccount) {

                alert(
                    "An account with this email already exists."
                );

                return;

            }


            const newAccount = {

                id: Date.now(),

                name: name,

                email: email,

                password: password,

                balance: 0,

                rewardPoints: 0,

                beneficiaries: [],

                transactions: []

            };


            accounts.push(newAccount);


            saveAccounts(accounts);


            saveCurrentUser(newAccount);


            alert(
                "Account created successfully!\n\nWelcome to SabiPay, " +
                name + "!"
            );


            window.location.href =
                "index.html";

        }
    );

}


// =========================================================
// LOGIN
// =========================================================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("loginEmail")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("loginPassword")
                    .value;


            const accounts =
                getAccounts();


            const account =
                accounts.find(
                    user =>
                        user.email.toLowerCase() ===
                        email.toLowerCase() &&
                        user.password === password
                );


            if (!account) {

                alert(
                    "Incorrect email or password."
                );

                return;

            }


            saveCurrentUser(account);


            alert(
                "Login successful! Welcome back, " +
                account.name
            );


            window.location.href =
                "index.html";

        }
    );

}


// =========================================================
// HOME PAGE
// =========================================================

const currentUser =
    getCurrentUser();


if (currentUser) {


    // -----------------------------------------
    // USER NAME
    // -----------------------------------------

    const welcomeName =
        document.getElementById(
            "welcomeName"
        );


    if (welcomeName) {

        welcomeName.textContent =
            currentUser.name;

    }


    // -----------------------------------------
    // USER AVATAR
    // -----------------------------------------

    const userAvatar =
        document.getElementById(
            "userAvatar"
        );


    if (userAvatar) {

        userAvatar.textContent =
            currentUser.name
                .charAt(0)
                .toUpperCase();

    }


    // -----------------------------------------
    // BALANCE
    // -----------------------------------------

    const balance =
        document.getElementById(
            "balance"
        );


    if (balance) {

        balance.textContent =
            formatMoney(
                currentUser.balance
            );

    }

}


// =========================================================
// ME / PROFILE PAGE
// =========================================================

if (currentUser) {


    const profileName =
        document.getElementById(
            "profileName"
        );


    const profileEmail =
        document.getElementById(
            "profileEmail"
        );


    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );


    if (profileName) {

        profileName.textContent =
            currentUser.name;

    }


    if (profileEmail) {

        profileEmail.textContent =
            currentUser.email;

    }


    if (profileAvatar) {

        profileAvatar.textContent =
            currentUser.name
                .charAt(0)
                .toUpperCase();

    }

}


// =========================================================
// SEND MONEY MODAL
// =========================================================

const sendMoneyButton =
    document.getElementById(
        "sendMoneyBtn"
    );


const sendMoneyModal =
    document.getElementById(
        "sendMoneyModal"
    );


const closeSendMoney =
    document.getElementById(
        "closeSendMoney"
    );


if (
    sendMoneyButton &&
    sendMoneyModal
) {

    sendMoneyButton.addEventListener(
        "click",
        function () {

            loadBeneficiaries();

            sendMoneyModal.classList.add(
                "active"
            );

        }
    );

}


// =========================================================
// CLOSE SEND MONEY MODAL
// =========================================================

if (closeSendMoney) {

    closeSendMoney.addEventListener(
        "click",
        function () {

            sendMoneyModal.classList.remove(
                "active"
            );

        }
    );

}


// Close when clicking outside modal

if (sendMoneyModal) {

    sendMoneyModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                sendMoneyModal
            ) {

                sendMoneyModal.classList.remove(
                    "active"
                );

            }

        }
    );

}


// =========================================================
// LOAD SAVED BENEFICIARIES
// =========================================================

function loadBeneficiaries() {

    const select =
        document.getElementById(
            "beneficiarySelect"
        );


    if (!select || !currentUser) {

        return;

    }


    select.innerHTML = `
        <option value="">
            Select a beneficiary
        </option>
    `;


    const beneficiaries =
        currentUser.beneficiaries || [];


    beneficiaries.forEach(
        (beneficiary, index) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                index;


            option.textContent =
                `${beneficiary.name} - ${beneficiary.bank} (${beneficiary.accountNumber})`;


            select.appendChild(
                option
            );

        }
    );

}


// =========================================================
// SELECT SAVED BENEFICIARY
// =========================================================

const beneficiarySelect =
    document.getElementById(
        "beneficiarySelect"
    );


if (beneficiarySelect) {

    beneficiarySelect.addEventListener(
        "change",
        function () {

            if (
                this.value === ""
            ) {

                return;

            }


            const index =
                Number(this.value);


            const beneficiary =
                currentUser.beneficiaries[index];


            if (!beneficiary) {

                return;

            }


            document.getElementById(
                "bankSelect"
            ).value =
                beneficiary.bank;


            document.getElementById(
                "accountNumber"
            ).value =
                beneficiary.accountNumber;


            document.getElementById(
                "beneficiaryName"
            ).value =
                beneficiary.name;

        }
    );

}


// =========================================================
// TRANSFER
// =========================================================

const transferForm =
    document.getElementById(
        "transferForm"
    );


if (transferForm) {

    transferForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            if (!currentUser) {

                alert(
                    "Please login first."
                );

                window.location.href =
                    "login.html";

                return;

            }


            // ---------------------------------
            // GET FORM VALUES
            // ---------------------------------

            const bank =
                document.getElementById(
                    "bankSelect"
                ).value;


            const accountNumber =
                document.getElementById(
                    "accountNumber"
                ).value.trim();


            const beneficiaryName =
                document.getElementById(
                    "beneficiaryName"
                ).value.trim();


            const amount =
                Number(
                    document.getElementById(
                        "transferAmount"
                    ).value
                );


            const saveBeneficiary =
                document.getElementById(
                    "saveBeneficiary"
                ).checked;


            // ---------------------------------
            // VALIDATE ACCOUNT NUMBER
            // ---------------------------------

            if (
                !/^\d{10}$/.test(
                    accountNumber
                )
            ) {

                alert(
                    "Account number must contain exactly 10 digits."
                );

                return;

            }


            // ---------------------------------
            // VALIDATE AMOUNT
            // ---------------------------------

            if (
                !amount ||
                amount <= 0
            ) {

                alert(
                    "Please enter a valid amount."
                );

                return;

            }


            // ---------------------------------
            // CHECK BALANCE
            // ---------------------------------

            if (
                amount >
                Number(currentUser.balance || 0)
            ) {

                alert(
                    "Insufficient balance."
                );

                return;

            }


            // ---------------------------------
            // CONFIRM TRANSFER
            // ---------------------------------

            const confirmation =
                confirm(
                    `Confirm Transfer\n\n` +
                    `Bank: ${bank}\n` +
                    `Account: ${accountNumber}\n` +
                    `Beneficiary: ${beneficiaryName}\n` +
                    `Amount: ${formatMoney(amount)}\n\n` +
                    `This is a frontend demo transfer.`
                );


            if (!confirmation) {

                return;

            }


            // ---------------------------------
            // DEDUCT MONEY
            // ---------------------------------

            currentUser.balance =
                Number(
                    currentUser.balance || 0
                ) - amount;


            // ---------------------------------
            // CREATE TRANSACTION
            // ---------------------------------

            const transaction = {

                id: Date.now(),

                type: "transfer",

                title:
                    "Bank Transfer",

                bank:
                    bank,

                accountNumber:
                    accountNumber,

                beneficiary:
                    beneficiaryName,

                amount:
                    amount,

                date:
                    new Date().toLocaleString(
                        "en-NG"
                    )

            };


            // ---------------------------------
            // ADD TRANSACTION
            // ---------------------------------

            if (
                !Array.isArray(
                    currentUser.transactions
                )
            ) {

                currentUser.transactions = [];

            }


            currentUser.transactions.unshift(
                transaction
            );


            // ---------------------------------
            // SAVE BENEFICIARY
            // ---------------------------------

            if (saveBeneficiary) {


                if (
                    !Array.isArray(
                        currentUser.beneficiaries
                    )
                ) {

                    currentUser.beneficiaries = [];

                }


                const alreadySaved =
                    currentUser.beneficiaries.some(
                        item =>
                            item.accountNumber ===
                                accountNumber &&
                            item.bank ===
                                bank
                    );


                if (!alreadySaved) {

                    currentUser.beneficiaries.push({

                        name:
                            beneficiaryName,

                        bank:
                            bank,

                        accountNumber:
                            accountNumber

                    });

                }

            }


            // ---------------------------------
            // UPDATE ACCOUNT LIST
            // ---------------------------------

            let accounts =
                getAccounts();


            const accountIndex =
                accounts.findIndex(
                    account =>
                        account.id ===
                        currentUser.id
                );


            if (accountIndex !== -1) {

                accounts[accountIndex] =
                    currentUser;

            }


            saveAccounts(
                accounts
            );


            saveCurrentUser(
                currentUser
            );


            // ---------------------------------
            // UPDATE SCREEN
            // ---------------------------------

            const balance =
                document.getElementById(
                    "balance"
                );


            if (balance) {

                balance.textContent =
                    formatMoney(
                        currentUser.balance
                    );

            }


            renderTransactions();


            // ---------------------------------
            // CLOSE MODAL
            // ---------------------------------

            sendMoneyModal.classList.remove(
                "active"
            );


            transferForm.reset();


            alert(
                "Transfer successful! ✅"
            );

        }
    );

}


// =========================================================
// DISPLAY TRANSACTIONS
// =========================================================

function renderTransactions() {

    const transactionList =
        document.getElementById(
            "transactionList"
        );


    if (
        !transactionList ||
        !currentUser
    ) {

        return;

    }


    const transactions =
        currentUser.transactions || [];


    if (transactions.length === 0) {

        transactionList.innerHTML = `

            <div class="transaction">

                <span>📭</span>

                <div>

                    <b>
                        No transactions yet
                    </b>

                    <small>
                        Your transactions will appear here
                    </small>

                </div>

            </div>

        `;

        return;

    }


    transactionList.innerHTML =
        transactions
            .slice(0, 10)
            .map(
                transaction => `

                <div class="transaction">

                    <span>🏦</span>

                    <div>

                        <b>
                            ${transaction.title}
                        </b>

                        <small>
                            ${transaction.beneficiary}
                            ·
                            ${transaction.bank}
                            <br>
                            ${transaction.date}
                        </small>

                    </div>

                    <strong>
                        -${formatMoney(
                            transaction.amount
                        )}
                    </strong>

                </div>

            `
            )
            .join("");

}


renderTransactions();


// =========================================================
// LOGOUT
// =========================================================

const logoutButton =
    document.getElementById(
        "logoutBtn"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "sabipayCurrentUser"
            );


            alert(
                "You have been logged out."
            );


            window.location.href =
                "login.html";

        }
    );

}