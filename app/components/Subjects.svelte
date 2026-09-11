<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, *, auto" columns="*" class="screen">
        <AppHeader row={0} back on:back={goBack} />

        <!-- Subject list, as cards like the Library's book cards -->
        <scrollView row={2} col={0}>
            <stackLayout class="container">
                <label text="Subjects" class="page-title" />
                {#each subjectRows as row}
                    <gridLayout rows="auto"
                        columns="*, auto"
                        class="card"
                        class:subject-empty={row.count === 0}
                        on:tap={() => openSubject(row)}
                    >
                        <label col={0} text={row.subject} class="card-title" verticalAlignment="center" />
                        <label
                            col={1}
                            text={`${row.count} book${row.count === 1 ? '' : 's'}`}
                            class="muted-text"
                            verticalAlignment="center"
                        />
                    </gridLayout>
                {/each}
            </stackLayout>
        </scrollView>

        <BottomNav row={3} active="library" />

    </gridLayout>
</page>

<script lang="ts">
    import AppHeader from './AppHeader.svelte';
    import BottomNav from './BottomNav.svelte';
    import { Frame } from '@nativescript/core';
    import { navigate } from '@nativescript-community/svelte-native';
    import SubjectBooks from './SubjectBooks.svelte';
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



</script>

<style>
    /* A subject with no books yet is still listed, but dimmed. */
    .subject-empty {
        opacity: 0.55;
    }
</style>
