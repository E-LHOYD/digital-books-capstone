<Lockscreen />

<script lang="ts">
    import Lockscreen from './components/Lockscreen.svelte';
    import { initFirebase } from "./services/firebase.js";
    import { onMount } from 'svelte';

    initFirebase();

    onMount(() => {
        // Check for updates after 5 seconds (non-blocking)
        setTimeout(() => {
            checkForUpdates();
        }, 5000);
    });

    async function checkForUpdates() {
        try {
            const CURRENT_VERSION = '1.0.0';
            const API_URL = 'https://admin-dashboard-xi-nine-5gm5r8ufpa.vercel.app/api/app-version';
            
            const response = await fetch(API_URL);
            if (!response.ok) return;
            
            const updateInfo = await response.json();
            
            if (updateInfo.version !== CURRENT_VERSION) {
                const message = `New version ${updateInfo.version} available!\n\nChanges:\n${updateInfo.changes.join('\n')}\n\nDownload: ${updateInfo.downloadUrl}`;
                
                const dialogs = require('@nativescript/core').dialogs;
                await dialogs.alert({
                    title: "📱 Update Available",
                    message: message,
                    okButtonText: "OK"
                });
            }
        } catch (error) {
            console.error("Update check failed:", error);
        }
    }
</script>