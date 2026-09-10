<!--
    A short tour of the app, one card at a time.

    Rendered inside a full-screen overlay that the page owns (Home straight
    after a new reader picks their interests, Profile from its "?" button), so
    this is just the card. It starts from the first step every time `open`
    turns true, and dispatches `close` when the reader finishes or skips.
-->
<stackLayout class="tour-box" verticalAlignment="center" horizontalAlignment="center" on:tap={swallowTap}>
    <gridLayout columns="*, auto" class="tour-top">
        <label col={0} text={'Step ' + (step + 1) + ' of ' + STEPS.length} class="tour-step" />
        <label
            col={1}
            text="Skip tour"
            class="tour-skip"
            visibility={last ? 'collapse' : 'visible'}
            on:tap={finish}
        />
    </gridLayout>

    <image src={current.image} stretch="aspectFit" class="tour-image" />
    <label text={current.title} class="tour-title" textWrap="true" />
    <label text={current.body} class="tour-body" textWrap="true" />

    <flexboxLayout class="tour-dots" justifyContent="center">
        {#each STEPS as _, i}
            <stackLayout class="tour-dot" class:tour-dot-on={i === step} />
        {/each}
    </flexboxLayout>

    <gridLayout columns="*, 12, *">
        <button
            col={0}
            text="Back"
            class="tour-back"
            isEnabled={step > 0}
            on:tap={back}
        />
        <button
            col={2}
            text={last ? 'Finish' : 'Next'}
            class="tour-next"
            on:tap={next}
        />
    </gridLayout>
</stackLayout>

<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let open = false;

    const dispatch = createEventDispatcher();

    const STEPS = [
        {
            image: '~/images/tutorial/welcome.png',
            title: 'Welcome to GD-Library',
            body: "Your school's digital library, right on your phone. This short tour shows you how to find a book, read it, and pick up right where you left off."
        },
        {
            image: '~/images/tutorial/library.png',
            title: 'Your Library',
            body: 'The Library is your home screen. "Recommended for you" at the top has books picked for your year level, program and interests. Every other book in the library is listed underneath, in "More in the library".'
        },
        {
            image: '~/images/tutorial/search.png',
            title: 'Search',
            body: 'Looking for something in particular? Type a title, an author or a book number into the search bar at the top of the Library, then tap Search.'
        },
        {
            image: '~/images/tutorial/subjects.png',
            title: 'Subjects and Browse more',
            body: 'Subjects groups the books by subject, such as Math or Science. Browse more shows the whole library in one list.'
        },
        {
            image: '~/images/tutorial/reading.png',
            title: 'Reading a book',
            body: 'Tap any book to see its cover and description, then tap "Read Book" to start. Your place is saved as you read. "Add to Shelf" keeps a book somewhere easy to find.'
        },
        {
            image: '~/images/tutorial/bookmark.png',
            title: 'Bookmarks',
            body: 'While reading, tap the bookmark icon at the top to mark the page you are on. "Go to bookmark" takes you straight back to it. Tap the icon again to remove it.'
        },
        {
            image: '~/images/tutorial/shelf.png',
            title: 'My Shelf',
            body: 'My Shelf, in the bar at the bottom, has your reading history and the shelves you make yourself. You can create up to five and name them what you like.'
        },
        {
            image: '~/images/tutorial/profile.png',
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
        border-width: 2;
        border-color: #201e1d;
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
        height: 190;
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
        margin-bottom: 16;
    }

    .tour-dots {
        margin-bottom: 16;
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

    .tour-back {
        background-color: white;
        color: #033047;
        border-width: 2;
        border-color: #201e1d;
        border-radius: 0;
        font-size: 16;
        font-weight: bold;
        height: 48;
        text-transform: none;
    }

    .tour-back:disabled {
        opacity: 0.4;
    }

    .tour-next {
        background-color: #033047;
        color: white;
        border-width: 0;
        border-radius: 0;
        font-size: 16;
        font-weight: bold;
        height: 48;
        text-transform: none;
    }
</style>
