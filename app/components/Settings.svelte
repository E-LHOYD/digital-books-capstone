<page actionBarHidden={true} class="page">
    <stackLayout class="container">
        <label text="Settings" class="title" />

        <!-- User Info -->
        <stackLayout class="setting-item">
            <label text="Logged in as:" class="info-label" />
            <label text={username || "Loading..."} class="username-display" />
        </stackLayout>

        <!-- Keep Logged In -->
        <stackLayout class="setting-item">
            <stackLayout orientation="horizontal" class="checkbox-container">
                <label 
                    text={keepLoggedIn ? "[✓]" : "[  ]"} 
                    class="checkbox-btn" 
                    on:tap={() => keepLoggedIn = !keepLoggedIn} 
                />
                <label text="Keep me logged in" class="setting-label" />
            </stackLayout>
        </stackLayout>

        <!-- Logout Button -->
        <button text="Logout" class="btn logout" on:tap={handleLogout} />

        <!-- Back Button -->
        <button text="Back" class="btn back" on:tap={goBack} />
    </stackLayout>
</page>

<script lang="ts">
    import { onMount } from 'svelte';
    import { navigate } from '@nativescript-community/svelte-native';
    import Home from './Home.svelte';
    import Lockscreen from './Lockscreen.svelte';
    import { logout, getSavedCredentials, saveCredentials, getCurrentUser, getUserProfile } from '../services/firebase';

    let keepLoggedIn = true; // Default to keep logged in
    let username = ""; // User's username

    onMount(async () => {
        // Load current keep logged in preference
        const credentials = getSavedCredentials();
        if (credentials) {
            keepLoggedIn = true;
        } else {
            keepLoggedIn = false;
        }

        // Load user's username
        await loadUsername();
    });

    async function loadUsername() {
        try {
            const currentUser = await getCurrentUser();
            if (currentUser && currentUser.uid) {
                const userProfile = await getUserProfile(currentUser.uid);
                if (userProfile && userProfile.username) {
                    username = userProfile.username;
                    console.log("Loaded username:", username);
                }
            }
        } catch (error) {
            console.error("Error loading username:", error);
        }
    }

    // Update keep logged in preference when checkbox is toggled
    $: if (keepLoggedIn !== undefined) {
        const credentials = getSavedCredentials();
        if (credentials) {
            saveCredentials(credentials.email, credentials.password, keepLoggedIn);
        }
    }

    async function handleLogout() {
        try {
            await logout();
            console.log("User logged out successfully");
            
            // Navigate back to Lockscreen after logout
            navigate({
                page: Lockscreen
            } as any);
        } catch (error) {
            console.error("Logout failed:", error);
            alert("Logout failed. Please try again.");
        }
    }

    function goBack() {
        navigate({
            page: Home
        } as any);
    }
</script>

<style>
    .page {
        background-color: #f5f5f5;
    }

    .container {
        padding: 20;
        vertical-align: center;
    }

    .title {
        font-size: 32;
        font-weight: bold;
        text-align: center;
        margin-bottom: 40;
        color: #033047;
    }

    .setting-item {
        background-color: white;
        border-radius: 8;
        padding: 20;
        margin: 10 0;
        border-width: 1;
        border-color: #ddd;
    }

    .info-label {
        font-size: 14;
        color: #666;
        margin-bottom: 5;
    }

    .username-display {
        font-size: 20;
        font-weight: bold;
        color: #033047;
    }

    .checkbox-container {
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

    .setting-label {
        font-size: 18;
        color: #033047;
        vertical-align: center;
    }

    .btn {
        width: 200;
        margin: 15 auto;
        padding: 15;
        border-radius: 8;
        font-size: 16;
        font-weight: bold;
    }

    .logout {
        background-color: #c62828;
        color: white;
        border-width: 0;
    }

    .back {
        background-color: white;
        color: #033047;
        border-width: 2;
        border-color: #033047;
    }
</style>