<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, *, auto, auto, auto, *, auto" columns="*" class="container">
        <!-- Kicker -->
        <label row="0" text="SCHOOL LIBRARY" class="kicker" />

        <!-- Logo: shelf bars -->
        <stackLayout row="2" orientation="horizontal" class="logo">
            <stackLayout class="bar bar-1" />
            <stackLayout class="bar bar-2" />
            <stackLayout class="bar bar-3" rotate="8" />
        </stackLayout>

        <!-- Wordmark -->
        <label row="3" text="GD-Library" class="title" />
        <label row="4" text="— — — — — — —" class="rule" />

        <!-- Loading -->
        <activityIndicator row="6" busy={true} class="loading-indicator" />
        <label row="7" text="LOADING" class="meta-label" />
    </gridLayout>
</page>

<script lang="ts">
    import { onMount } from 'svelte';
    import { navigate } from '@nativescript-community/svelte-native';
    import Login from './Login.svelte';
    import { autoLogin } from '../services/firebase';
    import Home from './Home.svelte';

    onMount(() => {
        // Attempt auto-login on app start
        attemptAutoLogin();
    });

    async function attemptAutoLogin() {
        try {
            console.log("Attempting auto-login...");
            const user = await autoLogin();
            if (user) {
                console.log("Auto-login successful:", user.email);
                navigate({
                    page: Home
                } as any);
            } else {
                console.log("No saved credentials or auto-login failed");
                setTimeout(() => {
                    goToLogin();
                }, 2000);
            }
        } catch (error) {
            console.error("Auto-login error:", error);
            setTimeout(() => {
                goToLogin();
            }, 2000);
        }
    }

    function goToLogin() {
        navigate({
            page: Login
        });
    }
</script>

<style>
    .page {
        background-color: #033047;
    }

    .container {
        padding: 24 24 32 24;
    }

    .kicker {
        color: #ffffff;
        opacity: 0.8;
        font-size: 12;
        letter-spacing: 0.14;
        horizontal-align: left;
    }

    .logo {
        horizontal-align: left;
        margin-bottom: 8;
    }

    .bar {
        width: 15;
        background-color: #ffffff;
        margin-right: 6;
        vertical-align: bottom;
    }

    .bar-1 { height: 72; }
    .bar-2 { height: 56; }
    .bar-3 { height: 64; opacity: 0.55; }

    /* Archivo lives in app/fonts as Archivo-Regular.ttf and Archivo-Bold.ttf,
       both reporting the family name "Archivo", so font-weight picks the right
       file. The sans-serif fallback matters: a missing font file fails silently
       on Android and the wordmark would otherwise render in whatever the
       platform chose. */
    .title {
        color: #ffffff;
        font-size: 44;
        font-weight: bold;
        font-family: Archivo, sans-serif;
        horizontal-align: left;
        margin-top: 16;
    }

    .rule {
        color: #ffffff;
        opacity: 0.9;
        font-size: 14;
        horizontal-align: left;
        margin-top: 8;
    }

    .loading-indicator {
        color: #ffffff;
        horizontal-align: left;
        margin-bottom: 10;
    }

    .meta-label {
        color: #ffffff;
        opacity: 0.7;
        font-size: 11;
        letter-spacing: 0.1;
        horizontal-align: left;
    }
</style>
