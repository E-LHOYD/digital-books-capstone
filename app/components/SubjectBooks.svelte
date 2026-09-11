<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, *, auto" columns="*" class="screen">
        <AppHeader row={0} back on:back={goBack} />

        <!-- Books -->
        <scrollView row={2} col={0}>
            <stackLayout class="container">
                <label text={subject} class="page-title" textWrap="true" />
                {#if books.length === 0}
                    <stackLayout class="empty-container">
                        <label
                            text={`No books under ${subject} yet.`}
                            class="empty-text"
                            textWrap="true"
                        />
                    </stackLayout>
                {:else}
                    <label text={`${books.length} book${books.length === 1 ? '' : 's'}`} class="count-text" />
                    {#each books as book (book.id)}
                        <stackLayout class="book-item" on:tap={() => goToBookDetails(book)}>
                            <label text={book.title} class="book-title" textWrap="true" />
                            <label text={book.author} class="book-author" />
                        </stackLayout>
                    {/each}
                {/if}
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
    import BookDetails from './BookDetails.svelte';
    import Home from './Home.svelte';

    export let subject: string;
    export let books: any[] = [];

    function goToBookDetails(book: any) {
        navigate({
            page: BookDetails,
            props: { book }
        } as any);
    }

    function goBack() {
        navigate({
            page: Home
        } as any);
    }
</script>

