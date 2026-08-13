<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, *, auto" columns="*">
        <stackLayout row={0} col={0} class="container">
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
        <stackLayout row={2} col={0} class="bottom-container-fixed">
            <stackLayout orientation="horizontal" class="bottom-buttons">
                <button text="Library" class="nav-btn" on:tap={goToLibrary} />
                <button text="My Shelf" class="nav-btn" on:tap={goToMyShelf} />
                <button text="Profile" class="nav-btn" on:tap={goToProfile} />
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
        margin-bottom: 30;
        color: #033047;
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
        border-width: 1;
        border-color: #033047;
        border-radius: 8;
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
        border-radius: 8;
        font-size: 16;
        font-weight: bold;
    }

    .cancel {
        background-color: white;
        color: #033047;
        border-width: 2;
        border-color: #033047;
    }

    .save {
        background-color: #033047;
        color: white;
        border-width: 0;
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
</style>
