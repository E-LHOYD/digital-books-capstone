<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, *, auto" columns="*" class="screen">
        <!-- Header: logo + wordmark -->
        <stackLayout row="0" orientation="horizontal" class="header">
            <stackLayout orientation="horizontal" class="logo">
                <stackLayout class="bar bar-1" />
                <stackLayout class="bar bar-2" />
                <stackLayout class="bar bar-3" rotate="8" />
            </stackLayout>
            <label text="GD-Library" class="brand" />
        </stackLayout>
        <stackLayout row="1" class="divider" />

        <!-- Books -->
        <scrollView row={2} col={0} class="books-scroll">
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

        <!-- Bottom Navigation -->
        <stackLayout row={3} col={0} class="bottom-container-fixed">
            <stackLayout orientation="horizontal" class="bottom-buttons">
                <stackLayout class="nav-btn" on:tap={goBack}>
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
    import BookDetails from './BookDetails.svelte';
    import MyShelf from './MyShelf.svelte';
    import Profile from './Profile.svelte';

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

    .books-scroll {
        padding: 28 20 0 20;
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
        border-radius: 0;
        border-width: 2;
        border-color: #201e1d;
    }

    .book-item:active {
        background-color: #f8f8f8;
    }

    .book-title {
        font-size: 17;
        font-weight: bold;
        color: #033047;
        margin-bottom: 4;
        font-family: Archivo, sans-serif;
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
