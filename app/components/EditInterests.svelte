<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, *, auto" columns="*" class="screen">
        <AppHeader row={0} back on:back={goBack} />

        <stackLayout row={2} col={0} class="container">
            <label text="Edit Interests" class="page-title" />
            <label text="Choose 3 subjects you like. They decide which books are recommended to you." class="muted-text" textWrap="true" />
            
            <flexboxLayout class="interests-grid" flexWrap="wrap">
                {#each DEFAULT_SUBJECTS as interest}
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
            
            <gridLayout rows="auto" columns="*, 12, *" class="button-container">
                <button col={0} text="Cancel" class="btn btn-secondary" on:tap={goBack} />
                <button col={2} text="Save" class="btn btn-primary" on:tap={saveInterests} />
            </gridLayout>
        </stackLayout>

        <BottomNav row={3} active="profile" />
    </gridLayout>
</page>

<script lang="ts">
    import AppHeader from './AppHeader.svelte';
    import BottomNav from './BottomNav.svelte';
    import { navigate } from '@nativescript-community/svelte-native';
    import Profile from './Profile.svelte';
    import { DEFAULT_SUBJECTS } from '../services/subjects';
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



</script>

<style>

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
        border-color: #033047;
        border-radius: 100;
        font-size: 14;
        text-transform: none;
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

</style>
