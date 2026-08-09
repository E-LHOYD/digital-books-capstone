<Lockscreen />

<script lang="ts">
    import Lockscreen from './components/Lockscreen.svelte';
    import { initFirebase } from "./services/firebase.js";
    import { checkForUpdates, isForcedUpdate, getDownloadUrl, getChangelog } from "./services/app-update.js";
    import { onMount } from 'svelte';

    initFirebase();

    onMount(() => {
        // Check for app updates on app start
        checkForAppUpdates();
    });

    async function checkForAppUpdates() {
        try {
            const updateInfo = await checkForUpdates();
            
            if (updateInfo) {
                console.log("App update available:", updateInfo.version);
                
                const forced = isForcedUpdate(updateInfo);
                const downloadUrl = getDownloadUrl(updateInfo);
                const changes = getChangelog(updateInfo);
                
                const message = `New version ${updateInfo.version} available!\n\nChanges:\n${changes.join('\n')}\n\nPlease visit ${downloadUrl} to download the update.`;
                
                if (forced) {
                    alert("⚠️ Required Update\n\n" + message);
                } else {
                    alert("📱 Update Available\n\n" + message);
                }
            }
        } catch (error) {
            console.error("Error checking for app updates:", error);
        }
    }
</script>