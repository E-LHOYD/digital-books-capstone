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
            <button text="Add to Shelf" class="btn btn-secondary" on:tap={showShelfSelector} />
        </stackLayout>

        <!-- Shelf Selection Modal -->
        {#if showShelfModal}
            <stackLayout class="modal-overlay" on:tap={hideShelfModal}>
                <stackLayout class="modal-content" on:tap={stopPropagation}>
                    <label text="Select a Shelf" class="modal-title" />
                    
                    <scrollView class="shelf-list">
                        <stackLayout>
                            {#each shelves as shelf}
                                <stackLayout 
                                    class="shelf-item" 
                                    on:tap={() => addToShelf(shelf.id)}
                                >
                                    <label text={shelf.name} class="shelf-name" />
                                    <label text={`${shelf.bookIds?.length || 0} books`} class="shelf-count" />
                                </stackLayout>
                            {/each}
                        </stackLayout>
                    </scrollView>

                    <stackLayout class="modal-actions">
                        <button text="Create New Shelf" class="btn btn-create" on:tap={showCreateShelfForm} />
                        <button text="Cancel" class="btn btn-cancel" on:tap={hideShelfModal} />
                    </stackLayout>

                    {#if showCreateForm}
                        <stackLayout class="create-form">
                            <textField 
                                hint="Shelf name" 
                                class="shelf-input" 
                                text={newShelfName}
                                on:textChange={(e) => newShelfName = e.value}
                            />
                            <stackLayout orientation="horizontal" class="form-actions">
                                <button text="Create" class="btn btn-confirm" on:tap={createNewShelf} />
                                <button text="Cancel" class="btn btn-cancel-small" on:tap={hideCreateShelfForm} />
                            </stackLayout>
                        </stackLayout>
                    {/if}
                </stackLayout>
            </stackLayout>
        {/if}

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
    import { addBookToShelf, getCurrentUserId, getUserShelves, createCustomShelf } from '../services/shelf.js';
    // @ts-ignore
    import { Book } from '../types';

    // @ts-ignore
    export let book: Book;

    // A book is only readable if its Firestore document carries a usable
    // storage URL in `fileUrl`. The admin dashboard uploads it and writes it there.
    $: canRead = isBookFileUrl(book.fileUrl);

    // Shelf modal state
    let showShelfModal = false;
    let showCreateForm = false;
    let shelves: any[] = [];
    let newShelfName = '';

    // Load shelves when component mounts
    async function loadShelves() {
        try {
            const userId = getCurrentUserId();
            if (userId) {
                shelves = await getUserShelves(userId);
            }
        } catch (error) {
            console.error('Error loading shelves:', error);
        }
    }

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

    function showShelfSelector() {
        loadShelves();
        showShelfModal = true;
    }

    function hideShelfModal() {
        showShelfModal = false;
        showCreateForm = false;
        newShelfName = '';
    }

    function stopPropagation(event: any) {
        event.stopPropagation();
    }

    function showCreateShelfForm() {
        showCreateForm = true;
    }

    function hideCreateShelfForm() {
        showCreateForm = false;
        newShelfName = '';
    }

    async function addToShelf(shelfId: string) {
        try {
            const userId = getCurrentUserId();
            if (!userId) {
                alert('Please log in to add books to shelves.');
                return;
            }

            const bookId = book.id;

            if (!bookId) {
                alert('Unable to add book: missing book ID');
                return;
            }

            await addBookToShelf(userId, shelfId, bookId);
            alert('Book added to shelf!');
            hideShelfModal();
        } catch (error) {
            console.error('Error adding book to shelf:', error);
            if ((error as any).message === 'Book already in shelf') {
                alert('This book is already in this shelf.');
            } else {
                alert('Failed to add book to shelf. Please try again.');
            }
        }
    }

    async function createNewShelf() {
        if (!newShelfName.trim()) {
            alert('Please enter a shelf name');
            return;
        }

        try {
            const userId = getCurrentUserId();
            if (!userId) {
                alert('Please log in to create shelves.');
                return;
            }

            await createCustomShelf(userId, newShelfName.trim());
            alert('Shelf created successfully!');
            
            // Reload shelves and show shelf selector
            await loadShelves();
            hideCreateShelfForm();
        } catch (error) {
            console.error('Error creating shelf:', error);
            if ((error as any).message === 'Maximum 5 custom shelves reached') {
                alert('You have reached the maximum of 5 custom shelves.');
            } else {
                alert('Failed to create shelf. Please try again.');
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

    .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        justify-content: center;
        align-items: center;
    }

    .modal-content {
        background-color: white;
        border-radius: 12;
        padding: 20;
        width: 80%;
        max-width: 400;
    }

    .modal-title {
        font-size: 20;
        font-weight: bold;
        color: #033047;
        margin-bottom: 15;
        text-align: center;
    }

    .shelf-list {
        max-height: 300;
        margin-bottom: 15;
    }

    .shelf-item {
        padding: 15;
        border-width: 1;
        border-color: #e0e0e0;
        border-radius: 8;
        margin-bottom: 10;
        background-color: #f9f9f9;
    }

    .shelf-name {
        font-size: 16;
        font-weight: bold;
        color: #033047;
    }

    .shelf-count {
        font-size: 14;
        color: #666;
        margin-top: 5;
    }

    .modal-actions {
        margin-top: 15;
    }

    .btn-create {
        background-color: #033047;
        color: white;
        font-size: 16;
        font-weight: bold;
        padding: 12 20;
        border-radius: 8;
        border-width: 0;
        margin: 0 5;
    }

    .btn-cancel {
        background-color: #f0f0f0;
        color: #033047;
        font-size: 16;
        font-weight: bold;
        padding: 12 20;
        border-radius: 8;
        border-width: 2;
        border-color: #033047;
        margin: 0 5;
    }

    .create-form {
        margin-top: 15;
        padding-top: 15;
        border-width: 1;
        border-color: #e0e0e0;
        border-radius: 8;
    }

    .shelf-input {
        font-size: 16;
        padding: 12;
        border-width: 1;
        border-color: #ccc;
        border-radius: 8;
        margin-bottom: 10;
    }

    .form-actions {
        margin-top: 10;
    }

    .btn-confirm {
        background-color: #033047;
        color: white;
        font-size: 16;
        font-weight: bold;
        padding: 10 20;
        border-radius: 8;
        border-width: 0;
        margin: 0 5;
    }

    .btn-cancel-small {
        background-color: #f0f0f0;
        color: #033047;
        font-size: 16;
        font-weight: bold;
        padding: 10 20;
        border-radius: 8;
        border-width: 2;
        border-color: #033047;
        margin: 0 5;
    }
</style>