<page actionBarHidden={true} class="page">
    <stackLayout class="container">
        <!-- App Title -->
        <label text="GD-Library" class="title" />

        <!-- Loading indicator -->
        <activityIndicator busy={true} class="loading-indicator" />
    </stackLayout>
</page>

<script lang="ts">
    import { onMount } from 'svelte';
    import { navigate } from '@nativescript-community/svelte-native';
    import Login from './Login.svelte';
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
                // Navigate to login after 2 seconds
                setTimeout(() => {
                    goToLogin();
                }, 2000);
            }
        } catch (error) {
            console.error("Auto-login error:", error);
            // Navigate to login after 2 seconds even on error
            setTimeout(() => {
                goToLogin();
            }, 2000);
        }
    }

    function goToLogin() {
        navigate({
            page: Login
        });
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

    .loading-indicator {
        margin-top: 40;
        color: #033047;
    }
</style>