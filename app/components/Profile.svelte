<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, *, auto" columns="*" class="screen">
        <AppHeader row={0} />

        <scrollView row={2} col={0}>
            <stackLayout class="container">
                <gridLayout columns="*, auto">
                    <label col={0} text="Profile" class="page-title" />
                    <button col={1} text="?" class="help-btn" on:tap={() => (showTutorial = true)} />
                </gridLayout>

                <!-- User Info -->
                <stackLayout class="card">
                    <label text="Username" class="card-label" />
                    <label text={username || "Loading..."} class="card-value" />
                </stackLayout>

                <!-- Academic Info (for students) -->
                {#if userRole === 'student'}
                    <stackLayout class="card">
                        <label text="Program" class="card-label" />
                        <label text={program || "Not specified"} class="card-value" />
                    </stackLayout>

                    <stackLayout class="card">
                        <label text="Year Level" class="card-label" />
                        <label text={yearLevel || "Not specified"} class="card-value" />
                    </stackLayout>
                {:else if userRole === 'teacher'}
                    <stackLayout class="card">
                        <label text="Department" class="card-label" />
                        <label text={department || "Not specified"} class="card-value" />
                    </stackLayout>
                {/if}

                <!-- Edit Interests Button -->
                <stackLayout class="card">
                    <label text="Interests" class="card-label" />
                    <label text={selectedInterests.join(', ') || "No interests selected"} class="card-value" textWrap="true" />
                    <button text="Edit Interests" class="btn btn-secondary edit-interests" on:tap={goToEditInterests} />
                </stackLayout>

                <!-- Settings Button -->
                <button text="Settings" class="btn btn-secondary" on:tap={goToSettings} />

                <!-- Logout Button -->
                <button text="Log Out" class="btn btn-danger" on:tap={handleLogout} />
            </stackLayout>
        </scrollView>

        <BottomNav row={3} active="profile" home />

        <!-- The tour, on demand from the ? button. Always mounted and collapsed. -->
        <gridLayout
            row={0}
            rowSpan={4}
            col={0}
            class="tour-overlay"
            visibility={showTutorial ? 'visible' : 'collapse'}
            on:tap={() => {}}
        >
            <TutorialCard open={showTutorial} on:close={() => (showTutorial = false)} />
        </gridLayout>
    </gridLayout>
</page>

<script lang="ts">
    import AppHeader from './AppHeader.svelte';
    import BottomNav from './BottomNav.svelte';
    import { onMount } from 'svelte';
    import { navigate } from '@nativescript-community/svelte-native';
    import Login from './Login.svelte';
    import Settings from './Settings.svelte';
    import EditInterests from './EditInterests.svelte';
    import TutorialCard from './TutorialCard.svelte';
    // @ts-ignore
    import { logout, getCurrentUser, getUserProfile } from '../services/firebase';

    let username = "";
    let selectedInterests: string[] = [];
    let userId = "";
    let refresh = false;
    let userRole = "";
    let program = "";
    let yearLevel = "";
    let department = "";
    let showTutorial = false;

    export { refresh, loadUserData };

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
                    selectedInterests = Array.isArray(userProfile.interests) ? userProfile.interests : [];
                    userRole = userProfile.role || "student";
                    
                    // Load academic information based on role
                    if (userRole === 'student') {
                        program = userProfile.course || userProfile.strand || "Not specified";
                        yearLevel = userProfile.year || userProfile.grade || "Not specified";
                    } else if (userRole === 'teacher') {
                        department = userProfile.department || "Not specified";
                    }
                    
                    console.log("Loaded user data:", { username, interests: selectedInterests, userRole, program, yearLevel, department });
                }
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            alert("Error loading profile data. Please try again.");
        }
    }

    async function handleLogout() {
        try {
            await logout();
            console.log("User logged out successfully");
            
            // Straight to Login. clearHistory so Back cannot return to the
            // signed-in pages.
            navigate({
                page: Login,
                clearHistory: true
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


</script>

<style>
    .edit-interests {
        margin-top: 10;
    }
    .help-btn {
        width: 44;
        height: 44;
        border-radius: 22;
        border-width: 2;
        border-color: #033047;
        background-color: white;
        color: #033047;
        font-size: 20;
        font-weight: bold;
        padding: 0;
        vertical-align: center;
    }

    .tour-overlay {
        background-color: rgba(0, 0, 0, 0.6);
    }

</style>
