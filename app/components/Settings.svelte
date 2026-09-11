<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, *, auto" columns="*" class="screen">
        <AppHeader row={0} back on:back={goBack} />

        <scrollView row={2} col={0}>
            <stackLayout class="container">
                <label text="Settings" class="page-title" />

                <!-- Keep Logged In -->
                <stackLayout class="card">
                    <stackLayout orientation="horizontal" class="checkbox-container" on:tap={() => keepLoggedIn = !keepLoggedIn}>
                        <label text={keepLoggedIn ? "✓" : ""} class="checkbox-btn" class:checkbox-on={keepLoggedIn} />
                        <label text="Keep me logged in" class="setting-label" />
                    </stackLayout>
                </stackLayout>

                <!-- Change Password Button -->
                <button text="Change Password" class="btn btn-secondary" on:tap={() => showPasswordModal = true} />
            </stackLayout>
        </scrollView>

        <BottomNav row={3} active="profile" />

        <!-- Change Password dialog. Inside the grid so it covers the whole
             screen; it used to be a second child of the page, which a page
             cannot have. -->
        {#if showPasswordModal}
            <gridLayout row={0} rowSpan={4} col={0} class="modal-overlay">
                <stackLayout class="modal-content" verticalAlignment="center" horizontalAlignment="center">
                    <label text="Change Password" class="modal-title" />

                    <label text="CURRENT PASSWORD" class="field-label" />
                    <textField
                        hint="Enter current password"
                        secure={true}
                        text={currentPassword}
                        on:textChange={(e) => currentPassword = e.value}
                        class="input"
                    />

                    <label text="NEW PASSWORD" class="field-label" />
                    <textField
                        hint="Enter new password"
                        secure={true}
                        text={newPassword}
                        on:textChange={(e) => newPassword = e.value}
                        class="input"
                    />

                    <label text="CONFIRM NEW PASSWORD" class="field-label" />
                    <textField
                        hint="Confirm new password"
                        secure={true}
                        text={confirmPassword}
                        on:textChange={(e) => confirmPassword = e.value}
                        class="input"
                    />

                    {#if passwordError}
                        <label text={passwordError} class="error-message" textWrap={true} />
                    {/if}

                    <gridLayout columns="*, 12, *" class="modal-actions">
                        <button col={0} text="Cancel" class="btn btn-secondary" on:tap={() => showPasswordModal = false} />
                        <button col={2} text="Confirm" class="btn btn-primary" on:tap={handleChangePassword} />
                    </gridLayout>
                </stackLayout>
            </gridLayout>
        {/if}
    </gridLayout>
</page>

<script lang="ts">
    import AppHeader from './AppHeader.svelte';
    import Profile from './Profile.svelte';
    import BottomNav from './BottomNav.svelte';
    import { onMount } from 'svelte';
    import { navigate } from '@nativescript-community/svelte-native';
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




    function goBack() {
        navigate({ page: Profile } as any);
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
    .checkbox-container {
        width: 100%;
        horizontal-align: left;
    }

    .checkbox-btn {
        width: 28;
        height: 28;
        background-color: white;
        color: white;
        border-width: 2;
        border-color: #033047;
        border-radius: 6;
        font-size: 16;
        font-weight: bold;
        margin-right: 12;
        text-align: center;
        vertical-align: center;
    }

    .checkbox-on {
        background-color: #033047;
    }

    .setting-label {
        font-size: 17;
        color: #201e1d;
        vertical-align: center;
    }
</style>