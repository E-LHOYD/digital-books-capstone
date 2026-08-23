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

        <stackLayout row={2} col={0} class="container">
            <label text="Edit Interests (Select 3)" class="title" />
            
            <flexboxLayout class="interests-grid" flexWrap="wrap">
                {#each SUBJECTS as interest}
                    <button 
                        text={interest} 
                        class="interest-btn" 
                        class:interest-btn-selected={tempSelectedInterests.includes(interest)}
                        on:tap={() => toggleTempInterest(interest)}
                        disabled={tempSelectedInterests.length >= 3 && !tempSelectedInterests.includes(interest)}
                    />
                {/each}
            </flexboxLayout>
            
            <label text={tempSelectedInterests.length + '/3 selected'} class="selection-count" />
            
            <stackLayout orientation="horizontal" class="button-container">
                <button text="Cancel" class="btn cancel" on:tap={goBack} />
                <button text="Save" class="btn save" on:tap={saveInterests} />
            </stackLayout>
        </stackLayout>

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
</page>

<script lang="ts">
    import { navigate } from '@nativescript-community/svelte-native';
    import Profile from './Profile.svelte';
    import Home from './Home.svelte';
    import MyShelf from './MyShelf.svelte';
    import { SUBJECTS } from '../services/subjects';
    // @ts-ignore
    import { updateUserProfile } from '../services/firebase';

    let tempSelectedInterests: string[] = [];
    let userId = "";

    // Props received from navigation
    let interests: string[] = [];
    let currentUserId: string = "";

    export { interests, currentUserId };

    // Initialize when component receives props
    $: if (interests.length > 0 || currentUserId) {
        tempSelectedInterests = [...interests];
        userId = currentUserId;
    }

    function toggleTempInterest(interest: string) {
        if (tempSelectedInterests.includes(interest)) {
            tempSelectedInterests = tempSelectedInterests.filter(i => i !== interest);
        } else if (tempSelectedInterests.length < 3) {
            tempSelectedInterests = [...tempSelectedInterests, interest];
        }
    }

    async function saveInterests() {
        if (tempSelectedInterests.length !== 3) {
            alert("Please select exactly 3 interests");
            return;
        }

        try {
            await updateUserProfile(userId, { interests: tempSelectedInterests });
            alert("Interests saved successfully!");
            goBack();
        } catch (error) {
            console.error("Error saving interests:", error);
            alert("Failed to save interests. Please try again.");
        }
    }

    function goBack() {
        navigate({
            page: Profile,
            props: { refresh: true }
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

    function goToProfile() {
        navigate({
            page: Profile
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

    .interests-grid {
        width: 100%;
        margin: 10 0;
        flex-direction: row;
        justify-content: space-between;
    }

    .interest-btn {
        width: 48%;
        height: 45;
        margin: 2% 1%;
        background-color: white;
        color: #033047;
        border-width: 2;
        border-color: #201e1d;
        border-radius: 0;
        font-size: 14;
    }

    .interest-btn-selected {
        background-color: #033047;
        color: white;
    }

    .interest-btn:disabled {
        opacity: 0.5;
    }

    .selection-count {
        font-size: 16;
        color: #666;
        text-align: center;
        margin: 10 0;
    }

    .button-container {
        margin-top: 20;
        width: 100%;
    }

    .btn {
        width: 48%;
        margin: 10 auto;
        padding: 15;
        border-radius: 0;
        font-size: 16;
        font-weight: bold;
    }

    .cancel {
        background-color: white;
        color: #033047;
        border-width: 2;
        border-color: #201e1d;
    }

    .save {
        background-color: #033047;
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
