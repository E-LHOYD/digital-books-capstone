<!--
    The first page is chosen here, before anything is drawn, so the splash
    screen goes straight to it: the Library for someone who asked to stay
    logged in and still has a session, the Login page for everyone else.
-->
<svelte:component this={startPage} />

<script lang="ts">
    import { onMount } from 'svelte';
    import { navigate } from '@nativescript-community/svelte-native';
    import Login from './components/Login.svelte';
    import Home from './components/Home.svelte';
    // @ts-ignore
    import { initFirebase, restoredSessionUser, getSavedCredentials, autoLogin } from "./services/firebase.js";

    initFirebase();

    const user = restoredSessionUser();
    const startPage = user ? Home : Login;

    onMount(async () => {
        // Rare: the reader asked to stay logged in, but Firebase no longer has
        // their session (it expired, or the app data was cleared). Their saved
        // credentials sign them back in behind the Login page, which then
        // gives way to the Library.
        if (user || !getSavedCredentials()) return;

        try {
            const again = await autoLogin();
            if (again) navigate({ page: Home, clearHistory: true, animated: false } as any);
        } catch (error) {
            console.error("Auto-login error:", error);
        }
    });
</script>
