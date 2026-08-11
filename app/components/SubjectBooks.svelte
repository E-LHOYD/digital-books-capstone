<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, *" columns="*" class="main-layout">

        <!-- Header -->
        <gridLayout row={0} col={0} rows="auto" columns="auto, *" class="header">
            <button row={0} col={0} text="Back" class="back-btn" on:tap={goBack} />
            <label row={0} col={1} text={subject} class="header-title" textWrap="false" />
        </gridLayout>

        <!-- Books -->
        <scrollView row={1} col={0} class="books-scroll">
            <stackLayout>
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

    </gridLayout>
</page>

<script lang="ts">
    import { Frame } from '@nativescript/core';
    import { navigate } from '@nativescript-community/svelte-native';
    import BookDetails from './BookDetails.svelte';

    export let subject: string;
    export let books: any[] = [];

    function goToBookDetails(book: any) {
        navigate({
            page: BookDetails,
            props: { book }
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

    .books-scroll {
        padding: 12 16;
    }

    .count-text {
        font-size: 13;
        color: #666;
        margin-bottom: 8;
    }

    .book-item {
        padding: 16;
        margin-bottom: 10;
        background-color: white;
        border-radius: 8;
        border-width: 1;
        border-color: #eee;
    }

    .book-item:active {
        background-color: #f8f8f8;
    }

    .book-title {
        font-size: 17;
        font-weight: bold;
        color: #033047;
        margin-bottom: 4;
        font-family: Milonga-Regular;
    }

    .book-author {
        font-size: 14;
        color: #666;
    }

    .empty-container {
        padding: 40 20;
    }

    .empty-text {
        font-size: 15;
        color: #666;
        text-align: center;
    }
</style>
