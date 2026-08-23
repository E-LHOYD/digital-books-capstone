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
                <label text="Profile" class="title" />

                <!-- User Info -->
                <stackLayout class="setting-item">
                    <label text="Username" class="info-label" />
                    <label text={username || "Loading..."} class="username-display" />
                </stackLayout>

                <!-- Edit Interests Button -->
                <stackLayout class="setting-item">
                    <label text="Interests" class="info-label" />
                    <label text={selectedInterests.join(', ') || "No interests selected"} class="interests-display" />
                    <button text="Edit Interests" class="btn edit-interests" on:tap={goToEditInterests} />
                </stackLayout>

                <!-- Settings Button -->
                <button text="Settings" class="btn settings" on:tap={goToSettings} />

                <!-- Logout Button -->
                <button text="Log Out" class="btn logout" on:tap={handleLogout} />
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
                <stackLayout class="nav-btn nav-btn-active">
                    <label text="👤" class="nav-icon" />
                    <label text="Profile" class="nav-text" />
                </stackLayout>
            </stackLayout>
        </stackLayout>
    </gridLayout>
</page>

<script lang="ts">
    import { onMount } from 'svelte';
    import { navigate } from '@nativescript-community/svelte-native';
    import Home from './Home.svelte';
    import Lockscreen from './Lockscreen.svelte';
    import Settings from './Settings.svelte';
    import MyShelf from './MyShelf.svelte';
    import EditInterests from './EditInterests.svelte';
    // @ts-ignore
    import { logout, getCurrentUser, getUserProfile } from '../services/firebase';

    let username = "";
    let selectedInterests: string[] = [];
    let userId = "";
    let refresh = false;

    export { refresh };

    $: if (refresh) {
        loadUserData();
        refresh = false;
    }

    onMount(async () => {
        await loadUserData();
    });

    async function loadUserData() {
        try {
            const currentUser = await getCurrentUser();
            if (currentUser && currentUser.uid) {
                userId = currentUser.uid;
                const userProfile = await getUserProfile(currentUser.uid);
                if (userProfile) {
                    username = userProfile.username || "";
                    selectedInterests = userProfile.interests || [];
                    console.log("Loaded user data:", { username, interests: selectedInterests });
                }
            }
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    }

    async function handleLogout() {
        try {
            await logout();
            console.log("User logged out successfully");
            
            navigate({
                page: Lockscreen
            } as any);
        } catch (error) {
            console.error("Logout failed:", error);
            alert("Logout failed. Please try again.");
        }
    }

    function goToSettings() {
        navigate({
            page: Settings
        } as any);
    }

    function goToEditInterests() {
        navigate({
            page: EditInterests,
            props: { 
                interests: selectedInterests,
                currentUserId: userId
            }
        } as any);
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

    .interests-display {
        font-size: 16;
        color: #666;
        margin-bottom: 10;
    }

    .edit-interests {
        background-color: #033047;
        color: white;
        border-width: 0;
        border-radius: 0;
        height: 48;
        font-size: 16;
        font-weight: bold;
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

    .settings {
        background-color: white;
        color: #033047;
        border-width: 2;
        border-color: #201e1d;
    }

    .logout {
        background-color: #c62828;
        color: white;
        border-width: 0;
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
</style>
