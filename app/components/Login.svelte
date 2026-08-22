<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, auto, *, auto" columns="*" class="screen">
        <!-- Header: logo + wordmark -->
        <stackLayout row="0" orientation="horizontal" class="header">
            <stackLayout orientation="horizontal" class="logo">
                <stackLayout class="bar bar-1" />
                <stackLayout class="bar bar-2" />
                <stackLayout class="bar bar-3" rotate="8" />
            </stackLayout>
            <label text="GD-Library" class="brand" />
        </stackLayout>
        <stackLayout row="1" class="divider" />

        <!-- Form -->
        <stackLayout row="2" class="container">
            <label text="Log in" class="title" />

            <label text="EMAIL / USERNAME" class="field-label" />
            <textField hint="name@school.edu" class="input" text={loginInput} on:textChange={(e) => loginInput = e.value} />

            <label text="PASSWORD" class="field-label" />
            <gridLayout columns="*, auto" class="password-row">
                <textField
                    hint="Password"
                    text={password}
                    on:textChange={(e) => password = e.value}
                    secure={isSecure}
                    class="input password-input"
                    col={0}
                />
                <button
                    text={isSecure ? "Show" : "Hide"}
                    class="toggle-btn"
                    col={1}
                    on:tap={() => (isSecure = !isSecure)}
                />
            </gridLayout>

            <!-- Error Message -->
            {#if errorMessage}
                <label text={errorMessage} class="error-message" textWrap={true} />
            {/if}

            <!-- Reset Notice -->
            {#if noticeMessage}
                <label text={noticeMessage} class="notice-message" textWrap={true} />
            {/if}

            <!-- Keep logged in + forgot password -->
            <gridLayout columns="auto, *, auto" class="options-row">
                <stackLayout col={0} orientation="horizontal" class="checkbox-container">
                    <label
                        text={keepLoggedIn ? "■" : " "}
                        class="checkbox-btn"
                        on:tap={() => keepLoggedIn = !keepLoggedIn}
                    />
                    <label text="Keep me logged in" class="checkbox-label" />
                </stackLayout>
                <button
                    col={2}
                    text={isSendingReset ? "Sending..." : "Forgot password?"}
                    class="link-btn"
                    isEnabled={!isSendingReset}
                    on:tap={handleForgotPassword}
                />
            </gridLayout>
        </stackLayout>

        <!-- Login Button pinned at bottom -->
        <stackLayout row="4" class="footer">
            <button text="Log in" class="btn login" on:tap={handleLogin}/>
        </stackLayout>
    </gridLayout>
</page>

<script lang="ts">
    import { navigate } from '@nativescript-community/svelte-native';
    import Lockscreen from './Lockscreen.svelte';
    import Home from './Home.svelte';
    import { login, getUserByUsername, sendPasswordReset } from '../services/firebase';

    //Password eye icon
    let password = "";
    let isSecure = true;
    let loginInput = "";
    let errorMessage = "";
    let keepLoggedIn = true; // Default to keep logged in
    let noticeMessage = "";
    let isSendingReset = false;

    // Function to check if input is email or username
    function isEmail(input: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    }

    // Resolve whatever is in the login box to an email address, the same way a
    // login does, so a reset can be asked for by username too.
    async function resolveEmail(input: string): Promise<string> {
        if (isEmail(input)) return input;

        const userData = await getUserByUsername(input);
        return userData?.email || "";
    }

    async function handleForgotPassword() {
        errorMessage = "";
        noticeMessage = "";

        if (!loginInput) {
            errorMessage = "Enter your email or username first, then tap Forgot Password.";
            return;
        }

        isSendingReset = true;

        try {
            const email = await resolveEmail(loginInput);

            if (email) {
                await sendPasswordReset(email);
            }
        } catch (error) {
            // A username that matches nobody throws here. Saying so would let
            // anyone test which usernames exist, so it is treated as a send.
            console.log("Password reset lookup failed:", error?.message);
        } finally {
            isSendingReset = false;
        }

        noticeMessage =
            "If that account exists, a reset link is on its way. Check the inbox and the spam folder.";
    }

    async function handleLogin() {
        // Clear previous error message
        errorMessage = "";

        if (!loginInput || !password) {
            errorMessage = "Please fill in all fields";
            console.log("Please fill in all fields");
            return;
        }

        try {
            let email;

            if (isEmail(loginInput)) {
                // Direct email login
                console.log("Login attempt with email:", loginInput);
                email = loginInput;
            } else {
                // Username login - get email from Firestore
                console.log("Login attempt with username:", loginInput);

                try {
                    const userData = await getUserByUsername(loginInput);
                    console.log("Found user in Firestore:", userData);

                    if (!userData || !userData.email) {
                        errorMessage = "User not found or missing email in profile";
                        return;
                    }

                    email = userData.email;
                    console.log("Authenticating with email:", email);
                } catch (usernameError) {
                    console.error("Username lookup failed:", usernameError);
                    errorMessage = "Username not found. Please try with your email instead.";
                    return;
                }
            }

            console.log("Attempting Firebase login with email:", email);
            const user = await login(email, password, keepLoggedIn);
            console.log("Login successful:", user);

            // Navigate to Home on successful login
            goToHome();
        } catch (error) {
            console.error("Login failed:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            console.error("Error details:", JSON.stringify(error, null, 2));

            // Show specific error message based on error type
            if (error.code === 'auth/user-not-found') {
                errorMessage = "User not found. Please check your username or email.";
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = "Incorrect password. Please try again.";
            } else if (error.message && error.message.includes('User not found')) {
                errorMessage = "Username not found. Please check your username.";
            } else {
                errorMessage = "Login failed: " + error.message;
            }
        }
    }

    function goToHome() {
        navigate({
            page: Home
        });
    }
</script>

<style>
    .page {
        background-color: #f3f2f2;
    }

    .screen {
        padding: 0;
    }

    .header {
        padding: 20 20 16 20;
        horizontal-align: left;
    }

    .logo {
        vertical-align: center;
        margin-right: 10;
    }

    .bar {
        width: 5;
        background-color: #201e1d;
        margin-right: 2;
        vertical-align: bottom;
    }

    .bar-1 { height: 22; }
    .bar-2 { height: 17; }
    .bar-3 { height: 19; background-color: #033047; }

    /* Archivo lives in app/fonts as Archivo-Regular.ttf and Archivo-Bold.ttf,
       both reporting the family name "Archivo", so font-weight picks the right
       file. The sans-serif fallback matters: a missing font file fails silently
       on Android and the wordmark would otherwise render in whatever the
       platform chose. */
    .brand {
        font-size: 15;
        font-weight: bold;
        font-family: Archivo, sans-serif;
        color: #201e1d;
        vertical-align: center;
    }

    .divider {
        height: 2;
        background-color: #201e1d;
        margin: 0 20;
    }

    .container {
        padding: 28 20 0 20;
    }

    .title {
        font-size: 34;
        font-weight: bold;
        font-family: Archivo, sans-serif;
        color: #201e1d;
        text-align: left;
        margin-bottom: 24;
    }

    .field-label {
        font-size: 12;
        letter-spacing: 0.1;
        color: #201e1d;
        margin-bottom: 6;
    }

    .input {
        border-width: 2;
        border-color: #201e1d;
        border-radius: 0;
        background-color: #ffffff;
        font-size: 16;
        padding: 10;
        height: 48;
        margin: 0 0 16 0;
        color: #201e1d;
    }

    .password-row {
        margin-bottom: 16;
    }

    .password-input {
        margin: 0 8 0 0;
    }

    .toggle-btn {
        width: 72;
        height: 48;
        background-color: #ffffff;
        border-width: 2;
        border-color: #201e1d;
        border-radius: 0;
        font-size: 14;
        color: #201e1d;
    }

    .options-row {
        margin: 4 0 0 0;
    }

    .checkbox-container {
        vertical-align: center;
    }

    .checkbox-btn {
        width: 24;
        height: 24;
        background-color: #ffffff;
        color: #033047;
        border-width: 2;
        border-color: #201e1d;
        border-radius: 0;
        font-size: 14;
        text-align: center;
        vertical-align: center;
        margin-right: 10;
    }

    .checkbox-label {
        font-size: 14;
        color: #201e1d;
        vertical-align: center;
    }

    .link-btn {
        background-color: transparent;
        color: #033047;
        font-size: 14;
        border-width: 0;
        margin: 0;
        padding: 6 0;
        text-decoration: underline;
    }

    .error-message {
        font-size: 13;
        color: #022638;
        margin: 0 0 12 0;
        padding: 10 12;
        background-color: #d8e2e9;
        border-radius: 0;
        border-width: 0 0 0 4;
        border-color: #033047;
    }

    .notice-message {
        color: #033047;
        font-size: 13;
        margin: 0 0 12 0;
    }

    .footer {
        padding: 0 20 24 20;
    }

    .btn.login {
        width: 100%;
        height: 48;
        margin: 0;
        padding: 10;
        border-radius: 0;
        font-size: 16;
        font-weight: bold;
        background-color: #033047;
        color: #ffffff;
        text-align: left;
    }
</style>
