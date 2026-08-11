<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, *" columns="*" class="main-layout">

        <!-- Header -->
        <gridLayout row={0} col={0} rows="auto" columns="auto, *" class="header">
            <button row={0} col={0} text="Back" class="back-btn" on:tap={goBack} />
            <label row={0} col={1} text="Subjects" class="header-title" />
        </gridLayout>

        <!-- Subject list -->
        <scrollView row={1} col={0} class="subjects-scroll">
            <stackLayout>
                <label
                    text="Browse the library by subject. A book can appear under more than one."
                    class="intro-text"
                    textWrap="true"
                />

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

    </gridLayout>
</page>

<script lang="ts">
    import { Frame } from '@nativescript/core';
    import { navigate } from '@nativescript-community/svelte-native';
    import SubjectBooks from './SubjectBooks.svelte';
    // @ts-ignore
    import { SUBJECTS, hasSubject } from '../services/subjects.js';

    // Passed in from the library so this page does not refetch what the
    // library already holds.
    export let books: any[] = [];

    // Every subject is listed, including ones with nothing in them yet, so the
    // set of subjects reads as fixed rather than as whatever happens to exist.
    $: subjectRows = SUBJECTS.map((subject: string) => ({
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
        Frame.topmost()?.goBack();
    }
</script>

<style>
    .page {
        background-color: #f5f5f5;
    }

    .main-layout {
        width: 100%;
        height: 100%;
    }

    .header {
        background-color: #033047;
        padding: 10 12;
    }

    .back-btn {
        background-color: transparent;
        color: white;
        font-size: 16;
        font-weight: bold;
        border-width: 0;
        padding: 6 12;
        margin: 0;
    }

    .header-title {
        color: white;
        font-size: 18;
        font-weight: bold;
        vertical-align: center;
        margin-left: 6;
    }

    .subjects-scroll {
        padding: 12 16;
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
        border-radius: 8;
        border-width: 1;
        border-color: #eee;
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
</style>
