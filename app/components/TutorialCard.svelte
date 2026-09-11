<!--
    A short tour of the app, one card at a time.

    Rendered inside a full-screen overlay that the page owns (Home straight
    after a new reader picks their interests, Profile from its "?" button), so
    this is just the card. It starts from the first step every time `open`
    turns true, and dispatches `close` when the reader finishes or skips.
-->
<!--
    A fixed-height card sized to the screen, so it never runs off the bottom:
    the step counter and the Back/Next buttons stay put, and the picture and
    text scroll between them when a phone is too short to show them all.
-->
<gridLayout
    class="tour-box"
    rows="auto, *, auto, auto"
    height={cardHeight}
    verticalAlignment="center"
    horizontalAlignment="center"
    on:tap={swallowTap}
>
    <gridLayout rows="auto" row={0} columns="*, auto" class="tour-top">
        <label col={0} text={'Step ' + (step + 1) + ' of ' + STEPS.length} class="tour-step" />
        <label
            col={1}
            text="Skip tour"
            class="tour-skip"
            visibility={last ? 'collapse' : 'visible'}
            on:tap={finish}
        />
    </gridLayout>

    <scrollView row={1}>
        <stackLayout>
            <image src={current.image} stretch="aspectFit" height={imageHeight} class="tour-image" />
            <label text={current.title} class="tour-title" textWrap="true" />
            <label text={current.body} class="tour-body" textWrap="true" />
        </stackLayout>
    </scrollView>

    <flexboxLayout row={2} class="tour-dots" justifyContent="center">
        {#each STEPS as _, i}
            <stackLayout class="tour-dot" class:tour-dot-on={i === step} />
        {/each}
    </flexboxLayout>

    <gridLayout rows="auto" row={3} columns="*, 12, *">
        <button
            col={0}
            text="Back"
            class="btn btn-secondary"
            isEnabled={step > 0}
            on:tap={back}
        />
        <button
            col={2}
            text={last ? 'Finish' : 'Next'}
            class="btn btn-primary"
            on:tap={next}
        />
    </gridLayout>
</gridLayout>

<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Screen } from '@nativescript/core';
    // @ts-ignore
    import { TUTORIAL_IMAGES } from '../services/tutorialImages.js';

    // The card takes most of the screen height, never more than it can show:
    // 96dp is left for the status bar and a margin above and below.
    const screenHeight = Screen.mainScreen.heightDIPs;
    const screenWidth = Screen.mainScreen.widthDIPs;
    const cardHeight = Math.max(360, Math.min(640, screenHeight - 96));
    // The pictures are 640 x 440. The card is 88% of the screen wide less 40dp
    // of padding, so this keeps their shape; capped so a short screen still
    // leaves room for the text.
    const imageHeight = Math.round(Math.min(((screenWidth * 0.88 - 40) * 440) / 640, cardHeight * 0.4));

    export let open = false;

    const dispatch = createEventDispatcher();

    const STEPS = [
        {
            image: TUTORIAL_IMAGES.welcome,
            title: 'Welcome to GD-Library',
            body: "Your school's digital library, right on your phone. This short tour shows you how to find a book, read it, and pick up right where you left off."
        },
        {
            image: TUTORIAL_IMAGES.library,
            title: 'Your Library',
            body: 'The Library is your home screen. "Recommended for you" at the top has books picked for your year level, program and interests. Every other book in the library is listed underneath, in "More in the library".'
        },
        {
            image: TUTORIAL_IMAGES.search,
            title: 'Search',
            body: 'Looking for something in particular? Type a title, an author or a book number into the search bar at the top of the Library, then tap Search.'
        },
        {
            image: TUTORIAL_IMAGES.subjects,
            title: 'Subjects and Browse more',
            body: 'Subjects groups the books by subject, such as Math or Science. Browse more shows the whole library in one list.'
        },
        {
            image: TUTORIAL_IMAGES.reading,
            title: 'Reading a book',
            body: 'Tap any book to see its cover and description, then tap "Read Book" to start. Your place is saved as you read. "Add to Shelf" keeps a book somewhere easy to find.'
        },
        {
            image: TUTORIAL_IMAGES.bookmark,
            title: 'Bookmarks',
            body: 'While reading, tap 📑 Bookmark under the title to bookmark the page you are on. Bookmark as many pages as you like, then tap ☰ Bookmarks to see them and tap a page to jump straight to it. Tap ✕ beside a page, or 🔖 Bookmarked while you are on it, to remove a bookmark.'
        },
        {
            image: TUTORIAL_IMAGES.shelf,
            title: 'My Shelf',
            body: 'My Shelf, in the bar at the bottom, has your reading history and the shelves you make yourself. You can create up to ten and name them what you like.'
        },
        {
            image: TUTORIAL_IMAGES.profile,
            title: 'Profile and Settings',
            body: 'Profile shows your username, program, year level and interests. Tap "Edit Interests" to change them. Settings has "Keep me logged in" and lets you change your password. Tap the ? on your Profile to see this tour again.'
        }
    ];

    let step = 0;
    let wasOpen = false;

    $: if (open !== wasOpen) {
        wasOpen = open;
        if (open) step = 0;
    }

    $: current = STEPS[step];
    $: last = step === STEPS.length - 1;

    function next() {
        if (step < STEPS.length - 1) step += 1;
        else finish();
    }

    function back() {
        if (step > 0) step -= 1;
    }

    function finish() {
        dispatch('close');
    }

    function swallowTap() {
        // Intentionally empty: keeps taps on the card from reaching the overlay.
    }
</script>

<style>
    .tour-box {
        background-color: white;
        border-radius: 12;
        padding: 20;
        width: 88%;
    }

    .tour-top {
        margin-bottom: 12;
    }

    .tour-step {
        font-size: 13;
        color: #6f6e6a;
        vertical-align: center;
    }

    .tour-skip {
        font-size: 14;
        color: #033047;
        text-decoration: underline;
        vertical-align: center;
        padding: 4 0 4 12;
    }

    /* The pictures are drawn at 640 x 440, so this keeps their shape at the
       card's width. They ring the thing each step describes in yellow. */
    .tour-image {
        width: 100%;
        margin-bottom: 12;
        border-width: 2;
        border-color: #201e1d;
        background-color: #d8e2e9;
    }

    .tour-title {
        font-size: 22;
        font-weight: bold;
        font-family: Archivo, sans-serif;
        color: #201e1d;
        margin-bottom: 8;
    }

    .tour-body {
        font-size: 15;
        color: #201e1d;
        line-height: 4;
        margin-bottom: 4;
    }

    .tour-dots {
        margin: 12 0;
    }

    .tour-dot {
        width: 8;
        height: 8;
        border-radius: 4;
        margin: 0 3;
        background-color: #cccccc;
    }

    .tour-dot-on {
        background-color: #033047;
    }

</style>
