<page>
    <stackLayout class="container">
        <!-- Header -->
        <stackLayout class="header">
            <label text={shelfName} class="shelf-title" />
            <button text="← Back" class="back-btn" on:tap={goBack} />
        </stackLayout>

        <!-- Books List -->
        <scrollView class="books-scroll">
            <stackLayout>
                {#if books.length === 0}
                    <stackLayout class="empty-container">
                        <label text="No books in this shelf" class="empty-text" />
                    </stackLayout>
                {:else}
                    {#each books as book (book.id)}
                        <gridLayout class="book-item" rows="auto, auto" columns="*, auto" on:tap={() => goToBookDetails(book)}>
                            <label row={0} col={0} text={book.title} class="book-title" />
                            <label row={1} col={0} text={book.author} class="book-author" />
                            {#if typeof book.percentage === 'number'}
                                <label
                                    row={0}
                                    col={1}
                                    rowSpan={2}
                                    text={`${Math.round(book.percentage)}%`}
                                    class="book-percent"
                                    verticalAlignment="center"
                                />
                            {/if}
                        </gridLayout>
                    {/each}
                {/if}
            </stackLayout>
        </scrollView>

        <!-- Remove from shelf button (only for custom shelves) -->
        {#if !isReadShelf && !isViewedShelf && books.length > 0}
            <button text="Remove Selected Books" class="remove-btn" on:tap={showRemoveDialog} />
        {/if}
    </stackLayout>
</page>

<script lang="ts">
    import { navigate } from '@nativescript-community/svelte-native';
    import MyShelf from './MyShelf.svelte';
    import BookDetails from './BookDetails.svelte';
    // @ts-ignore
    import type { Book } from '../types';

    // @ts-ignore
    export let shelfId: string;
    // @ts-ignore
    export let shelfName: string;
    // @ts-ignore
    export let books: Book[];
    // @ts-ignore
    export let isReadShelf: boolean;
    // @ts-ignore
    export let isViewedShelf: boolean = false;

    function goBack() {
        navigate({
            page: MyShelf
        } as any);
    }

    function goToBookDetails(book: any) {
        navigate({
            page: BookDetails,
            props: { book }
        } as any);
    }

    function showRemoveDialog() {
        // For now, this is a placeholder for future functionality
        alert('Remove books functionality will be implemented in the next update.');
    }
</script>

<style>
    .container {
        padding: 20;
    }

    .header {
        margin-bottom: 20;
    }

    .shelf-title {
        font-size: 28;
        font-weight: bold;
        color: #033047;
        text-align: center;
        margin-bottom: 15;
        font-family: Milonga-Regular;
    }

    .back-btn {
        width: 120;
        padding: 10;
        background-color: #033047;
        color: white;
        font-size: 16;
        font-weight: bold;
        border-radius: 8;
        border-width: 0;
    }

    .books-scroll {
        height: 450;
        border-width: 1;
        border-color: #eee;
        border-radius: 8;
        margin-bottom: 15;
    }

    .book-item {
        padding: 15;
        border-bottom-width: 1;
        border-bottom-color: #f0f0f0;
        margin: 5 0;
        background-color: white;
        border-radius: 8;
        box-shadow: 0 1 3px rgba(0,0,0,0.1);
    }

    .book-item:active {
        background-color: #f8f8f8;
        opacity: 0.8;
    }

    .book-percent {
        font-size: 15;
        font-weight: bold;
        color: #1b7f3b;
        margin-left: 10;
    }

    .book-title {
        font-size: 18;
        font-weight: bold;
        color: #033047;
        margin-bottom: 5;
    }

    .book-author {
        font-size: 14;
        color: #666;
    }

    .empty-container {
        padding: 40;
        align-items: center;
    }

    .empty-text {
        font-size: 16;
        color: #999;
        text-align: center;
    }

    .remove-btn {
        width: 100%;
        padding: 15;
        background-color: #c62828;
        color: white;
        font-size: 16;
        font-weight: bold;
        border-radius: 8;
        border-width: 0;
    }
</style>