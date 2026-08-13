<page actionBarHidden={true} class="page">
    <gridLayout rows="*, auto" columns="*">
        <scrollView row={0} col={0}>
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
        <stackLayout row={1} col={0} class="bottom-container-fixed">
            <stackLayout orientation="horizontal" class="bottom-buttons">
                <button text="Library" class="nav-btn" on:tap={goToLibrary} />
                <button text="My Shelf" class="nav-btn" on:tap={goToMyShelf} />
                <button text="Profile" class="nav-btn" on:tap={goToProfile} />
            </stackLayout>
        </stackLayout>
    </gridLayout>

    <!-- Change Password Modal -->
    {#if showPasswordModal}
        <gridLayout class="modal-overlay" rows="auto, *" columns="*">
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

    .change-password {
        background-color: #033047;
        color: white;
        border-width: 0;
    }

    .btn {
        width: 200;
        margin: 15 auto;
        padding: 15;
        border-radius: 8;
        font-size: 16;
        font-weight: bold;
    }

    .bottom-container-fixed {
        padding: 10 5;
        vertical-align: bottom;
        background-color: white;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
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
        font-size: 18;
        font-weight: bold;
        border-width: 2;
        border-radius: 4;
        border-color: #033047;
        margin: 0;
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
        border-radius: 8;
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
        font-size: 14;
        color: #666;
        margin-bottom: 5;
        margin-top: 10;
    }

    .modal-input {
        border-width: 1;
        border-color: #ccc;
        border-radius: 8;
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
        border-radius: 8;
        border-width: 1;
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
    }

    .modal-save {
        background-color: #033047;
        color: white;
        border-width: 0;
        width: 48%;
    }
</style>