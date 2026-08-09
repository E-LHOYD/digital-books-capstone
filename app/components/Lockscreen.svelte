<page actionBarHidden={true} class="page">
    <stackLayout class="container">
        <!-- App Title -->
        <label text="GD-Library" class="title" />

        <!-- Buttons -->
        <button text="Login" class="btn login" on:tap={goToLogin} />
        <button text="Sign Up" class="btn signup" on:tap={goToSignup} />
    </stackLayout>
</page>

<script lang="ts">
    import { onMount } from 'svelte';
    import { navigate } from '@nativescript-community/svelte-native';
    import Login from './Login.svelte';
    import Signup from './Signup.svelte';
    import { autoLogin } from '../services/firebase';
    import Home from './Home.svelte';

    onMount(() => {
        // Attempt auto-login on app start
        attemptAutoLogin();
    });

    async function attemptAutoLogin() {
        try {
            console.log("Attempting auto-login...");
            const user = await autoLogin();
            if (user) {
                console.log("Auto-login successful:", user.email);
                // Navigate directly to Home if auto-login succeeds
                navigate({
                    page: Home
                } as any);
            } else {
                console.log("No saved credentials or auto-login failed");
            }
        } catch (error) {
            console.error("Auto-login error:", error);
        }
    }

    function goToLogin() {
        navigate({
            page: Login
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
        background-image: url("~/images/pastelblurlights.jpg");
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center;
    }
    
    .container {
        vertical-align: center;
        align-items: center;
        padding: 20;

    }

    .title {
        font-size: 65;
        font-weight: bold;
        margin-bottom: 60;
        text-align: center;
        font-family: Milonga-Regular;
        color: #033047;
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

    .signup {
        background-color: white;
        color: #033047;
        border-width: 4;
        border-color: #033047;
    }
</style>