<Lockscreen />

<script lang="ts">
    import Lockscreen from './components/Lockscreen.svelte';
    import { initFirebase } from "./services/firebase.js";
    import { checkForUpdates, isForcedUpdate, getDownloadUrl, getChangelog } from "./services/app-update.js";
    import { onMount } from 'svelte';

    initFirebase();

    onMount(() => {
        // Check for app updates in background, don't block app startup
        setTimeout(() => {
            checkForAppUpdates();
        }, 3000); // Wait 3 seconds after app loads before checking
    });

    async function checkForAppUpdates() {
        try {
            console.log("Checking for app updates...");
            const updateInfo = await checkForUpdates();
            
            if (updateInfo) {
                console.log("App update available:", updateInfo.version);
                
                const forced = isForcedUpdate(updateInfo);
                const downloadUrl = getDownloadUrl(updateInfo);
                const changes = getChangelog(updateInfo);
                
                const message = `New version ${updateInfo.version} available!\n\nChanges:\n${changes.join('\n')}\n\nDownload: ${downloadUrl}`;
                
                // Use NativeScript's dialog instead of browser alert
                const dialogs = require('@nativescript/core').dialogs;
                
                if (forced) {
                    await dialogs.alert({
                        title: "⚠️ Required Update",
                        message: message,
                        okButtonText: "OK"
                    });
                } else {
                    await dialogs.alert({
                        title: "📱 Update Available",
                        message: message,
                        okButtonText: "OK"
                    });
                }
            } else {
                console.log("No update available");
            }
        } catch (error) {
            console.error("Error checking for app updates:", error);
            // Don't block app if update check fails
        }
    }
</script>