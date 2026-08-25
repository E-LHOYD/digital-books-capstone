<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, *, auto" columns="*" class="screen">
        <!-- Header: back button + logo + wordmark -->
        <stackLayout row="0" orientation="horizontal" class="header">
            <button text="←" class="back-btn" on:tap={goBack} />
            <stackLayout orientation="horizontal" class="logo">
                <stackLayout class="bar bar-1" />
                <stackLayout class="bar bar-2" />
                <stackLayout class="bar bar-3" rotate="8" />
            </stackLayout>
            <label text="GD-Library" class="brand" />
        </stackLayout>
        <stackLayout row="1" class="divider" />

        <!-- Subject list -->
        <scrollView row={2} col={0} class="subjects-scroll">
            <stackLayout>
                {#each subjectRows as row}
                    <stackLayout
                        class="subject-item"
                        class:subject-empty={row.count === 0}
                        on:tap={() => openSubject(row)}
                    >
                        <gridLayout rows="auto" columns="*, auto">
                            <label row={0} col={0} text={row.subject} class="subject-name" />
                            <label
                                row={0} col={1}
                                text={`${row.count} book${row.count === 1 ? '' : 's'}`}
                                class="subject-count"
                            />
                        </gridLayout>
                    </stackLayout>
                {/each}
            </stackLayout>
        </scrollView>

        <!-- Bottom Navigation -->
        <stackLayout row={3} col={0} class="bottom-container-fixed">
            <stackLayout orientation="horizontal" class="bottom-buttons">
                <stackLayout class="nav-btn nav-btn-active" on:tap={goToLibrary}>
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
    import { Frame } from '@nativescript/core';
    import { navigate } from '@nativescript-community/svelte-native';
    import SubjectBooks from './SubjectBooks.svelte';
    import MyShelf from './MyShelf.svelte';
    import Profile from './Profile.svelte';
    import Home from './Home.svelte';
    // @ts-ignore
    import { DEFAULT_SUBJECTS, hasSubject } from '../services/subjects.js';

    // Passed in from the library so this page does not refetch what the
    // library already holds.
    export let books: any[] = [];

    // Every subject is listed, including ones with nothing in them yet, so the
    // set of subjects reads as fixed rather than as whatever happens to exist.
    $: subjectRows = DEFAULT_SUBJECTS.map((subject: string) => ({
        subject,
        books: books.filter((book) => hasSubject(book, subject))
    })).map((row) => ({ ...row, count: row.books.length }));

    function openSubject(row: any) {
        if (row.count === 0) return;

        navigate({
            page: SubjectBooks,
            props: { subject: row.subject, books: row.books }
        } as any);
    }

    function goBack() {
        navigate({
            page: Home
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

    .back-btn {
        font-size: 24;
        font-weight: bold;
        color: #033047;
        background-color: transparent;
        border-width: 0;
        padding: 0;
        margin-right: 15;
        vertical-align: center;
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

    .subjects-scroll {
        padding: 28 20 0 20;
    }

    .intro-text {
        font-size: 13;
        color: #666;
        margin-bottom: 12;
    }

    .subject-item {
        padding: 16;
        margin-bottom: 10;
        background-color: white;
        border-radius: 0;
        border-width: 2;
        border-color: #201e1d;
    }

    .subject-item:active {
        background-color: #f8f8f8;
    }

    .subject-empty {
        opacity: 0.55;
    }

    .subject-name {
        font-size: 17;
        font-weight: bold;
        color: #033047;
        vertical-align: center;
    }

    .subject-count {
        font-size: 13;
        color: #666;
        vertical-align: center;
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
