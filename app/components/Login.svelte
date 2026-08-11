<page actionBarHidden={true} class="page">
    <stackLayout class="container">

        <!-- Title -->
        <label text="Login" class="title" />

        <!-- Input: Email / Username -->
        <textField hint="Email / Username" class="input" text={loginInput} on:textChange={(e) => loginInput = e.value} />

        <!-- Password input with toggle -->
        <gridLayout columns="*, auto" class="password-container">
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

        <!-- Forgot Password -->
        <button
            text={isSendingReset ? "Sending..." : "Forgot Password?"}
            class="link-btn"
            isEnabled={!isSendingReset}
            on:tap={handleForgotPassword}
        />

        <!-- Keep Logged In Checkbox -->
        <stackLayout orientation="horizontal" class="checkbox-container">
            <label 
                text={keepLoggedIn ? "[✓]" : "[  ]"} 
                class="checkbox-btn" 
                on:tap={() => keepLoggedIn = !keepLoggedIn} 
            />
            <label text="Keep me logged in" class="checkbox-label" />
        </stackLayout>

        <!-- Login Button -->
        <button text="Login" class="btn login" on:tap={handleLogin}/>

        <!-- Sign Up Button -->
        <button text="Sign Up" class="btn signup" on:tap={goToSignup} />

        <!-- Back Button -->
        <button text="Back" class="btn back" on:tap={() => navigate({ page: Lockscreen })} />

    </stackLayout>
</page>

<script lang="ts">
    import { navigate } from '@nativescript-community/svelte-native';
    import Lockscreen from './Lockscreen.svelte';
    import Home from './Home.svelte';
    import Signup from './Signup.svelte';
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

    function goToSignup() {
        navigate({
            page: Signup
        } as any);
    }
</script>

<style>
    .page {
        background-color: white;
    }

    .container {
        vertical-align: center;
        padding: 20;
    }

    .title {
        font-size: 40;
        font-weight: bold;
        text-align: center;
        margin-bottom: 30;
        color: #033047;
    }

    .input {
        border-width: 1;
        border-color: #ccc;
        border-radius: 8;
        font-size: 16;
        padding: 10;
        height: 50;
        margin: 10 0;
    }

    .password-container {
        margin: 10 0;
        width: 100%;
        height: 50;
        border-width: 1;
        border-color: #ccc;
        border-radius: 8;
        background-color: white;
        vertical-align: center;
        padding: 0;
    }

    .password-input {
        width: 100%;
        padding-left: 10;
        border-color: transparent;
        border-width: 0;
    }

    .toggle-btn {
        width: 60;
        height: 50;
        background-color: transparent;
        font-size: 14;
        color: #033047;
        border-width: 0;
    }

    .btn {
        width: 150;
        margin: 10;
        padding: 10;
        border-radius: 100;
        font-size: 16;
        font-weight: bold;
    }

    .notice-message {
        color: #1a5fb4;
        font-size: 14;
        margin: 6 0;
        text-align: center;
    }

    .link-btn {
        background-color: transparent;
        color: #033047;
        font-size: 14;
        border-width: 0;
        margin: 0;
        padding: 6 0;
    }

    .login {
        background-color: #033047;
        color: white;
    }

    .signup {
        background-color: #033047;
        color: white;
        border-width: 0;
    }

    .back {
        background-color: white;
        color: #033047;
        border-width: 4;
        border-color: #033047;
    }

    .error-message {
        font-size: 14;
        color: #c62828;
        text-align: center;
        margin: 10 0;
        padding: 10;
        background-color: #ffebee;
        border-radius: 8;
        border-width: 1;
        border-color: #ef9a9a;
    }

    .checkbox-container {
        margin: 15 0;
        width: 100%;
        horizontal-align: left;
    }

    .checkbox-btn {
        width: 40;
        height: 30;
        background-color: white;
        color: #033047;
        border-width: 2;
        border-color: #033047;
        border-radius: 4;
        font-size: 20;
        font-weight: bold;
        margin-right: 10;
        text-align: center;
        vertical-align: center;
    }

    .checkbox-label {
        font-size: 16;
        color: #033047;
        vertical-align: center;
    }
</style>