<!--
    The Library / My Shelf / Profile bar at the bottom of every main screen,
    with the section the screen belongs to highlighted. Tapping a section goes
    to its first screen; tapping the one you are already on at that first
    screen does nothing.
-->
<stackLayout {row} col={0} class="bottom-container-fixed">
    <stackLayout orientation="horizontal" class="bottom-buttons">
        <stackLayout class="nav-btn" class:nav-btn-active={active === 'library'} on:tap={() => go('library')}>
            <label text="📚" class="nav-icon" />
            <label text="Library" class="nav-text" />
        </stackLayout>
        <stackLayout class="nav-btn" class:nav-btn-active={active === 'shelf'} on:tap={() => go('shelf')}>
            <label text="📖" class="nav-icon" />
            <label text="My Shelf" class="nav-text" />
        </stackLayout>
        <stackLayout class="nav-btn" class:nav-btn-active={active === 'profile'} on:tap={() => go('profile')}>
            <label text="👤" class="nav-icon" />
            <label text="Profile" class="nav-text" />
        </stackLayout>
    </stackLayout>
</stackLayout>

<script lang="ts">
    import { navigate } from '@nativescript-community/svelte-native';
    import Home from './Home.svelte';
    import MyShelf from './MyShelf.svelte';
    import Profile from './Profile.svelte';

    export let row = 0;
    /** Which section this screen belongs to: 'library', 'shelf' or 'profile'. */
    export let active = '';
    /** True on a section's first screen, where tapping its own tab is a no-op. */
    export let home = false;

    const PAGES: Record<string, any> = { library: Home, shelf: MyShelf, profile: Profile };

    function go(section: string) {
        if (section === active && home) return;
        navigate({ page: PAGES[section] } as any);
    }
</script>

<style>
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
