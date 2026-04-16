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

        <!-- Login Button -->
        <button text="Login" class="btn login" on:tap={handleLogin}/>

        <!-- Back Button -->
        <button text="Back" class="btn back" on:tap={() => navigate({ page: Lockscreen })} />

    </stackLayout>
</page>

<script lang="ts">
    import { navigate } from '@nativescript-community/svelte-native';
    import Lockscreen from './Lockscreen.svelte';
    import Home from './Home.svelte';
    import { login, getUserByUsername } from '../services/firebase';

    //Password eye icon
    let password = "";
    let isSecure = true;
    let loginInput = "";

    // Function to check if input is email or username
    function isEmail(input: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    }

    async function handleLogin() {
        if (!loginInput || !password) {
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
                
                const userData = await getUserByUsername(loginInput);
                console.log("Found user in Firestore:", userData);
                
                email = userData.email;
                console.log("Authenticating with email:", email);
            }
            
            const user = await login(email, password);
            console.log("Login successful:", user);
            
            // Navigate to Home on successful login
            goToHome();
        } catch (error) {
            console.error("Login failed:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            // Handle login error (show message to user)
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

    .login {
        background-color: #033047;
        color: white;
    }

    .back {
        background-color: white;
        color: #033047;
        border-width: 4;
        border-color: #033047;
    }
</style>