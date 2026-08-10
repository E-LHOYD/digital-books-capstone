<page>
    <stackLayout class="container">

        <!-- Cover -->
        <stackLayout class="detail-cover">
            <label text="image" class="cover-text" />
        </stackLayout>

        <!-- Title -->
        <label text={book.title} class="detail-title" />

        <!-- Author -->
        <label text={book.author} class="detail-author" />

        <!-- Description -->
        <label text={book.detail || 'No description available'} textWrap="true" class="detail-description" />

        <!-- Availability notice -->
        {#if !canRead}
            <stackLayout class="notice">
                <label
                    text="No readable file is attached to this book yet."
                    class="notice-text"
                    textWrap="true"
                />
            </stackLayout>
        {/if}

        <!-- Buttons Row -->
        <stackLayout orientation="horizontal" class="buttons-row">
            <button text="Read Book" class="btn btn-primary" on:tap={readBook} isEnabled={canRead} />
            <button text="Add to Read" class="btn btn-secondary" on:tap={addToRead} />
        </stackLayout>

        <!-- Back Button -->
        <button text="Back" class="btn btn-back" on:tap={goBack} />

    </stackLayout>
</page>

<script lang="ts">
    import { navigate } from '@nativescript-community/svelte-native';
    import Home from './Home.svelte';
    import Reader from './Reader.svelte';
    import { isBookFileUrl } from '../services/storage.js';
    // @ts-ignore
    import { addBookToShelf, getCurrentUserId } from '../services/shelf.js';
    // @ts-ignore
    import { Book } from '../types';

    // @ts-ignore
    export let book: Book;

    // A book is only readable if its Firestore document carries a usable
    // storage URL in `fileUrl`. The admin dashboard uploads it and writes it there.
    $: canRead = isBookFileUrl(book.fileUrl);

    function readBook() {
        if (!canRead) {
            console.error('Book has no usable fileUrl:', book.title, book.fileUrl);
            alert(
                book.fileUrl
                    ? "This book's file link is not valid, so it cannot be opened. " +
                      'Please ask an administrator to upload the file again.'
                    : 'No file has been uploaded for this book yet, so it cannot be read. ' +
                      'Please ask an administrator to upload it.'
            );
            return;
        }

        navigate({
            page: Reader,
            props: { book }
        } as any);
    }

    function goBack() {
        navigate({
            page: Home
        } as any);
    }

    async function addToRead() {
        try {
            const userId = getCurrentUserId();
            if (!userId) {
                alert('Please log in to add books to your read shelf.');
                return;
            }

            const bookId = book.id;

            if (!bookId) {
                alert('Unable to add book: missing book ID');
                return;
            }

            // Add book to the "read" shelf
            await addBookToShelf(userId, 'read', bookId);
            alert('Book added to your read shelf!');
        } catch (error) {
            console.error('Error adding book to read shelf:', error);
            if ((error as any).message === 'Book already in shelf') {
                alert('This book is already in your read shelf.');
            } else {
                alert('Failed to add book to read shelf. Please try again.');
            }
        }
    }
</script>

<style>
    .container {
        padding: 20;
        align-items: center;
    }

    .detail-cover {
        width: 200;
        height: 200;
        border-radius: 8;
        margin-bottom: 20;
        background-color: #f0f0f0;
        justify-content: center;
        align-items: center;
    }

    .cover-text {
        font-size: 16;
        color: #666;
        text-align: center;
    }

    .detail-title {
        font-size: 24;
        font-weight: bold;
        color: #033047;
        margin-bottom: 10;
        text-align: center;
    }

    .detail-author {
        font-size: 18;
        color: #666;
        margin-bottom: 20;
        text-align: center;
    }

    .detail-description {
        font-size: 16;
        color: #333;
        margin-bottom: 30;
        padding: 0 10;
        text-align: center;
    }

    .buttons-row {
        margin-bottom: 20;
    }

    .btn {
        font-size: 18;
        font-weight: bold;
        padding: 15 30;
        border-radius: 8;
        border-width: 0;
        margin: 0 5;
    }

    .btn-primary {
        background-color: #033047;
        color: white;
    }

    .btn-secondary {
        background-color: #f0f0f0;
        color: #033047;
        border-width: 2;
        border-color: #033047;
    }

    .btn-back {
        background-color: #666;
        color: white;
        width: 200;
    }

    .notice {
        padding: 12;
        background-color: #fff3f0;
        border-radius: 8;
        margin-bottom: 20;
        width: 100%;
        border-width: 1;
        border-color: #ffccc7;
    }

    .notice-text {
        font-size: 14;
        color: #c62828;
        text-align: center;
    }
</style>