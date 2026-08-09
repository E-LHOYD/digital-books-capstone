<Lockscreen />

<script lang="ts">
    import Lockscreen from './components/Lockscreen.svelte';
    import { initFirebase } from "./services/firebase.js";
    import { onMount } from 'svelte';

    initFirebase();

    onMount(() => {
        // Simple version check without external dependency
        setTimeout(() => {
            checkForAppUpdates();
        }, 3000);
    });

    async function checkForAppUpdates() {
        try {
            console.log("Checking for app updates...");
            
            const CURRENT_VERSION = '1.0.0';
            const API_URL = 'https://admin-dashboard-xi-nine-5gm5r8ufpa.vercel.app/api/app-version';
            
            const response = await fetch(API_URL);
            if (!response.ok) {
                console.log("Update check failed");
                return;
            }
            
            const updateInfo = await response.json();
            console.log("Server version:", updateInfo.version, "Current version:", CURRENT_VERSION);
            
            if (updateInfo.version !== CURRENT_VERSION) {
                console.log("Update available:", updateInfo.version);
                
                const message = `New version ${updateInfo.version} available!\n\nChanges:\n${updateInfo.changes.join('\n')}\n\nDownload: ${updateInfo.downloadUrl}`;
                
                const dialogs = require('@nativescript/core').dialogs;
                await dialogs.alert({
                    title: "📱 Update Available",
                    message: message,
                    okButtonText: "OK"
                });
            } else {
                console.log("App is up to date");
            }
        } catch (error) {
            console.error("Error checking for updates:", error);
        }
    }
</script>