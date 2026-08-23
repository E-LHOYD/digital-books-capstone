<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, *, auto" columns="*" class="screen">
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

        <scrollView row={2} col={0}>
            <stackLayout class="container">
                <label text="Settings" class="title" />

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

                <!-- Change Password Button -->
                <button text="Change Password" class="btn change-password" on:tap={() => showPasswordModal = true} />
            </stackLayout>
        </scrollView>

        <!-- Bottom Navigation -->
        <stackLayout row={3} col={0} class="bottom-container-fixed">
            <stackLayout orientation="horizontal" class="bottom-buttons">
                <stackLayout class="nav-btn" on:tap={goToLibrary}>
                    <label text="📚" class="nav-icon" />
                    <label text="Library" class="nav-text" />
                </stackLayout>
                <stackLayout class="nav-btn" on:tap={goToMyShelf}>
                    <label text="📖" class="nav-icon" />
                    <label text="My Shelf" class="nav-text" />
                </stackLayout>
                <stackLayout class="nav-btn" on:tap={goToProfile}>
                    <label text="👤" class="nav-icon" />
                    <label text="Profile" class="nav-text" />
                </stackLayout>
            </stackLayout>
        </stackLayout>
    </gridLayout>

    <!-- Change Password Modal -->
    {#if showPasswordModal}
        <gridLayout row={0} rowSpan={4} class="modal-overlay" rows="auto, *" columns="*">
            <stackLayout row={0} col={0} class="modal-content">
                <label text="Change Password" class="modal-title" />
                
                <label text="Current Password" class="input-label" />
                <textField 
                    hint="Enter current password" 
                    secure={true} 
                    text={currentPassword} 
                    on:textChange={(e) => currentPassword = e.value} 
                    class="modal-input" 
                />
                
                <label text="New Password" class="input-label" />
                <textField 
                    hint="Enter new password" 
                    secure={true} 
                    text={newPassword} 
                    on:textChange={(e) => newPassword = e.value} 
                    class="modal-input" 
                />
                
                <label text="Confirm New Password" class="input-label" />
                <textField 
                    hint="Confirm new password" 
                    secure={true} 
                    text={confirmPassword} 
                    on:textChange={(e) => confirmPassword = e.value} 
                    class="modal-input" 
                />
                
                {#if passwordError}
                    <label text={passwordError} class="error-message" textWrap={true} />
                {/if}
                
                <stackLayout orientation="horizontal" class="modal-buttons">
                    <button text="Cancel" class="btn modal-cancel" on:tap={() => showPasswordModal = false} />
                    <button text="Change Password" class="btn modal-save" on:tap={handleChangePassword} />
                </stackLayout>
            </stackLayout>
        </gridLayout>
    {/if}
</page>

<script lang="ts">
    import { onMount } from 'svelte';
    import { navigate } from '@nativescript-community/svelte-native';
    import Home from './Home.svelte';
    import Profile from './Profile.svelte';
    import MyShelf from './MyShelf.svelte';
    // @ts-ignore
    import { getSavedCredentials, saveCredentials, getCurrentUser, changePassword, login } from '../services/firebase';

    let keepLoggedIn = true; // Default to keep logged in
    let showPasswordModal = false;
    let currentPassword = "";
    let newPassword = "";
    let confirmPassword = "";
    let passwordError = "";

    onMount(async () => {
        // Load current keep logged in preference
        const credentials = getSavedCredentials();
        if (credentials) {
            keepLoggedIn = true;
        } else {
            keepLoggedIn = false;
        }
    });

    // Update keep logged in preference when checkbox is toggled
    $: if (keepLoggedIn !== undefined) {
        const credentials = getSavedCredentials();
        if (credentials) {
            saveCredentials(credentials.email, credentials.password, keepLoggedIn);
        }
    }

    function goToLibrary() {
        navigate({
            page: Home
        } as any);
    }

    function goToMyShelf() {
        navigate({
            page: MyShelf
        } as any);
    }

    function goToProfile() {
        navigate({
            page: Profile
        } as any);
    }

    async function handleChangePassword() {
        passwordError = "";
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            passwordError = "Please fill in all fields";
            return;
        }
        
        if (newPassword !== confirmPassword) {
            passwordError = "New passwords do not match";
            return;
        }
        
        if (newPassword.length < 6) {
            passwordError = "New password must be at least 6 characters";
            return;
        }
        
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser || !currentUser.email) {
                passwordError = "User not found";
                return;
            }
            
            // Re-authenticate with current password
            await login(currentUser.email, currentPassword, true);
            
            // Change password
            await changePassword(newPassword);
            
            // Update saved credentials if keeping logged in
            if (keepLoggedIn) {
                saveCredentials(currentUser.email, newPassword, true);
            }
            
            showPasswordModal = false;
            currentPassword = "";
            newPassword = "";
            confirmPassword = "";
            alert("Password changed successfully!");
        } catch (error) {
            console.error("Error changing password:", error);
            if (error.code === 'auth/wrong-password') {
                passwordError = "Current password is incorrect";
            } else {
                passwordError = "Failed to change password. Please try again.";
            }
        }
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

    .setting-item {
        background-color: white;
        border-radius: 0;
        padding: 20;
        margin: 0 0 16 0;
        border-width: 2;
        border-color: #201e1d;
    }

    .info-label {
        font-size: 12;
        letter-spacing: 0.1;
        color: #201e1d;
        margin-bottom: 6;
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
        border-color: #201e1d;
        border-radius: 0;
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

    .change-password {
        background-color: #033047;
        color: white;
        border-width: 0;
        border-radius: 0;
        height: 48;
    }

    .btn {
        width: 100%;
        height: 48;
        margin: 0 0 16 0;
        padding: 10;
        border-radius: 0;
        font-size: 16;
        font-weight: bold;
    }

    .bottom-container-fixed {
        padding: 0 20 24 20;
    }

    .bottom-buttons {
        width: 100%;
        border-width: 4;
        border-color: #033047;
        background-color: #033047;
        border-radius: 8;
    }

    .nav-btn {
        width: 33.33%;
        height: 65;
        background-color: white;
        color: #033047;
        font-size: 14;
        font-weight: bold;
        border-width: 2;
        border-radius: 4;
        border-color: #033047;
        margin: 0;
        vertical-align: center;
    }

    .nav-icon {
        font-size: 20;
        margin-bottom: 4;
        text-align: center;
    }

    .nav-text {
        font-size: 12;
        text-align: center;
    }

    .nav-btn-active {
        background-color: #033047;
        color: white;
        border-width: 0;
    }

    .modal-overlay {
        background-color: rgba(0, 0, 0, 0.5);
        width: 100%;
        height: 100%;
    }

    .modal-content {
        background-color: white;
        border-radius: 0;
        padding: 20;
        margin: 20;
        width: 90%;
    }

    .modal-title {
        font-size: 20;
        font-weight: bold;
        color: #033047;
        margin-bottom: 20;
        text-align: center;
    }

    .input-label {
        font-size: 12;
        letter-spacing: 0.1;
        color: #201e1d;
        margin-bottom: 6;
        margin-top: 10;
    }

    .modal-input {
        border-width: 2;
        border-color: #201e1d;
        border-radius: 0;
        padding: 10;
        margin: 5 0;
    }

    .error-message {
        font-size: 14;
        color: #c62828;
        text-align: center;
        margin: 10 0;
        padding: 10;
        background-color: #ffebee;
        border-radius: 0;
        border-width: 2;
        border-color: #ef9a9a;
    }

    .modal-buttons {
        margin-top: 20;
        width: 100%;
    }

    .modal-cancel {
        background-color: white;
        color: #033047;
        border-width: 2;
        border-color: #033047;
        width: 48%;
        border-radius: 0;
    }

    .modal-save {
        background-color: #033047;
        color: white;
        border-width: 0;
        width: 48%;
        border-radius: 0;
    }
</style>