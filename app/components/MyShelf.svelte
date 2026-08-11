<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, *, auto" columns="*" class="main-layout">
        <!-- Header -->
        <stackLayout row={0} col={0} class="header-container">
            <label text="My Shelf" class="header-title" />
        </stackLayout>
        
        <!-- Main Content -->
        <scrollView row={1} col={0} class="scroll-container">
            <stackLayout class="content">
                <!-- Read Shelf -->
                <stackLayout class="shelf-item" on:tap={() => goToShelfBooks('read')}>
                    <stackLayout class="shelf-header">
                        <label text="📚 Read" class="shelf-name" />
                        <label text={readBooks.length + ' books'} class="shelf-count" />
                    </stackLayout>
                    <stackLayout class="shelf-preview">
                        {#if readBooks.length > 0}
                            {#each readBooks.slice(0, 3) as book}
                                <label text={book.title} class="preview-book" />
                            {/each}
                        {:else}
                            <label text="No books read yet" class="empty-text" />
                        {/if}
                    </stackLayout>
                </stackLayout>

                <!-- Viewed Shelf -->
                <stackLayout class="shelf-item" on:tap={() => goToShelfBooks('viewed')}>
                    <stackLayout class="shelf-header">
                        <label text="👁️ Viewed" class="shelf-name" />
                        <label text={viewedBooks.length + ' books'} class="shelf-count" />
                    </stackLayout>
                    <stackLayout class="shelf-preview">
                        {#if viewedBooks.length > 0}
                            {#each viewedBooks.slice(0, 3) as book}
                                <label text={book.title} class="preview-book" />
                            {/each}
                        {:else}
                            <label text="No books viewed yet" class="empty-text" />
                        {/if}
                    </stackLayout>
                </stackLayout>

                <!-- Create Shelf Button -->
                {#if customShelves.length < 5}
                    <button text="+ Create New Shelf" class="create-shelf-btn" on:tap={showCreateShelfDialog} />
                {:else}
                    <stackLayout class="max-shelves-notice">
                        <label text="Maximum 5 custom shelves reached" class="notice-text" />
                    </stackLayout>
                {/if}

                <!-- Custom Shelves -->
                {#each customShelves as shelf}
                    <stackLayout class="shelf-item" on:tap={() => goToShelfBooks(shelf.id)}>
                        <stackLayout class="shelf-header">
                            <label text={shelf.name} class="shelf-name" />
                            <label text={shelf.bookIds.length + ' books'} class="shelf-count" />
                        </stackLayout>
                        <stackLayout class="shelf-preview">
                            {#if shelf.bookIds.length > 0}
                                {#each getShelfBooks(shelf).slice(0, 3) as book}
                                    <label text={book.title} class="preview-book" />
                                {/each}
                            {:else}
                                <label text="Empty shelf" class="empty-text" />
                            {/if}
                        </stackLayout>
                    </stackLayout>
                {/each}

            </stackLayout>
        </scrollView>

        <!-- Bottom Navigation -->
        <stackLayout row={2} col={0} class="bottom-container-fixed">
            <stackLayout orientation="horizontal" class="bottom-buttons">
                <button text="Library" class="nav-btn" on:tap={goToLibrary} />
                <button text="My Shelf" class="nav-btn nav-btn-active" />
                <button text="Settings" class="nav-btn" on:tap={goToSettings} />
            </stackLayout>
        </stackLayout>

        <!-- Create Shelf Modal -->
        {#if showCreateModal}
            <gridLayout row={0} rowSpan={3} col={0} class="modal-overlay" on:tap={hideCreateModal}>
                <stackLayout class="modal-content" verticalAlignment="center" horizontalAlignment="center" on:tap={stopPropagation}>
                    <label text="Create New Shelf" class="modal-title" />
                    
                    <textField 
                        hint="Shelf name" 
                        class="shelf-input" 
                        text={newShelfName}
                        on:textChange={(e) => (newShelfName = e?.value ?? e?.object?.text ?? '')}
                    />
                    
                    {#if createError}
                        <label text={createError} class="create-error" textWrap="true" />
                    {/if}

                    <stackLayout orientation="horizontal" class="modal-actions">
                        <button text="Create" class="btn btn-create" on:tap={createShelf} />
                        <button text="Cancel" class="btn btn-cancel" on:tap={hideCreateModal} />
                    </stackLayout>
                </stackLayout>
            </gridLayout>
        {/if}

        <!-- Result Modal -->
        {#if resultKind}
            <gridLayout row={0} rowSpan={3} col={0} class="modal-overlay" on:tap={hideResult}>
                <stackLayout class="modal-content" verticalAlignment="center" horizontalAlignment="center" on:tap={stopPropagation}>
                    <label
                        text={resultKind === 'success' ? 'Success' : 'Something went wrong'}
                        class="modal-title {resultKind === 'success' ? 'result-success' : 'result-error'}"
                    />

                    <label text={resultMessage} class="result-message" textWrap="true" />

                    <stackLayout class="modal-actions">
                        <button text="OK" class="btn btn-create" on:tap={hideResult} />
                    </stackLayout>
                </stackLayout>
            </gridLayout>
        {/if}
    </gridLayout>
</page>

<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { firebase } from '@nativescript/firebase-core';
    import '@nativescript/firebase-firestore';
    import { navigate } from '@nativescript-community/svelte-native';
    // @ts-ignore
    import type { Shelf, Book } from '../types';
    import Home from './Home.svelte';
    import Settings from './Settings.svelte';
    import ShelfBooks from './ShelfBooks.svelte';
    import { Auth } from '@nativescript/firebase-auth';
    // @ts-ignore
    import { getUserShelves, createCustomShelf, getCurrentUserId } from '../services/shelf.js';

    let customShelves: any[] = [];
    let readBooks: any[] = [];
    let viewedBooks: any[] = [];
    let allBooks: any[] = [];
    let currentUserId: string | null = null;
    let showCreateModal = false;
    let newShelfName = '';
    // Validation problems stay inside the create modal so the name can be
    // corrected without losing it; the outcome of a submit gets its own modal.
    let createError = '';
    let resultKind: 'success' | 'error' | null = null;
    let resultMessage = '';

    let auth: any = null;
    let authListener: any = null;
    let loadedForUid: string | null = null;

    onMount(() => {
        console.log('MyShelf component mounted');

        // Auth is a class here, not a function, and this plugin exposes
        // addAuthStateChangeListener rather than the web SDK's onAuthStateChanged.
        // Getting either wrong threw before the listener was ever registered,
        // which left currentUserId null and made every shelf action fail.
        auth = new Auth();

        authListener = (user: any) => {
            console.log('Auth state changed:', user ? 'User logged in: ' + user.uid : 'No user');
            handleUser(user);
        };
        auth.addAuthStateChangeListener(authListener);

        // The listener does not necessarily fire for an already signed-in user,
        // so seed from the current value too.
        handleUser(auth.currentUser);
    });

    onDestroy(() => {
        if (auth && authListener) {
            auth.removeAuthStateChangeListener(authListener);
        }
    });

    async function handleUser(user: any) {
        if (!user) {
            currentUserId = null;
            loadedForUid = null;
            return;
        }

        currentUserId = user.uid;

        // Guard against loading twice when the listener and the initial seed
        // both report the same user.
        if (loadedForUid === user.uid) return;
        loadedForUid = user.uid;

        // Books must be loaded before shelves: loadReadBooks and loadViewedBooks
        // filter allBooks, so running these concurrently left both shelves empty
        // on first open.
        await loadAllBooks();
        await loadUserData();
    }

    async function loadUserData() {
        try {
            currentUserId = getCurrentUserId();
            if (!currentUserId) {
                console.log('No user logged in');
                return;
            }

            // Load user's shelves from Firestore using service
            const shelves = await getUserShelves(currentUserId);
            customShelves = shelves.filter((s: any) => !s.isReadShelf && !s.isViewedShelf);
            
            // Load read books
            const readShelf = shelves.find((s: any) => s.isReadShelf);
            if (readShelf && readShelf.bookIds) {
                await loadReadBooks(readShelf.bookIds);
            }

            // Load viewed books
            const viewedShelf = shelves.find((s: any) => s.isViewedShelf);
            if (viewedShelf && viewedShelf.bookIds) {
                await loadViewedBooks(viewedShelf.bookIds);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async function loadAllBooks() {
        try {
            const snapshot = await firebase()
                .firestore()
                .collection('books')
                .get();

            allBooks = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    author: data.author,
                    detail: data.detail || '',
                    fileUrl: data.fileUrl || null,
                    coverPath: `~/ebooks/cover/${data.title.replace(/\s+/g, '').toLowerCase()}cover.jpg`,
                };
            });
        } catch (error) {
            console.error('Error loading all books:', error);
        }
    }

    async function loadReadBooks(bookIds: string[]) {
        try {
            readBooks = allBooks.filter(book => bookIds.includes(book.id || ''));
        } catch (error) {
            console.error('Error loading read books:', error);
        }
    }

    async function loadViewedBooks(bookIds: string[]) {
        try {
            viewedBooks = allBooks.filter(book => bookIds.includes(book.id || ''));
        } catch (error) {
            console.error('Error loading viewed books:', error);
        }
    }

    function getShelfBooks(shelf: any): any[] {
        const ids = shelf?.bookIds || [];
        return allBooks.filter(book => ids.includes(book.id || ''));
    }

    function goToShelfBooks(shelfId: string) {
        const isReadShelf = shelfId === 'read';
        const isViewedShelf = shelfId === 'viewed';
        let shelfName = 'Shelf';
        let books: any[] = [];

        if (isReadShelf) {
            shelfName = 'Read';
            books = readBooks;
        } else if (isViewedShelf) {
            shelfName = 'Viewed';
            books = viewedBooks;
        } else {
            const shelf = customShelves.find(s => s.id === shelfId);
            if (!shelf) {
                console.error('Shelf not found:', shelfId);
                return;
            }
            shelfName = shelf.name || 'Shelf';
            books = getShelfBooks(shelf);
        }
        
        navigate({
            page: ShelfBooks,
            props: { 
                shelfId, 
                shelfName, 
                books,
                isReadShelf,
                isViewedShelf
            }
        } as any);
    }

    function showCreateShelfDialog() {
        console.log('showCreateShelfDialog called');
        showCreateModal = true;
        newShelfName = '';
        createError = '';
        console.log('Modal should be visible now');
    }

    function hideCreateModal() {
        showCreateModal = false;
        newShelfName = '';
        createError = '';
    }

    function showResult(kind: 'success' | 'error', message: string) {
        resultKind = kind;
        resultMessage = message;
    }

    function hideResult() {
        resultKind = null;
        resultMessage = '';
    }

    function stopPropagation(event: any) {
        event.stopPropagation();
    }

    async function createShelf() {
        createError = '';

        if (!currentUserId) {
            console.error('No current user ID');
            createError = 'You must be signed in to create shelves.';
            return;
        }

        if (!newShelfName.trim()) {
            console.error('Empty shelf name');
            createError = 'Please enter a shelf name.';
            return;
        }

        console.log('Creating shelf:', newShelfName, 'for user:', currentUserId);

        try {
            const newShelf = await createCustomShelf(currentUserId, newShelfName.trim());
            console.log('Shelf created successfully:', newShelf);
            // Reload shelves from Firestore to ensure it's saved
            await loadUserData();
            customShelves = customShelves;
            console.log('Shelves reloaded:', customShelves);
            const createdName = newShelf?.name || 'Shelf';
            hideCreateModal();
            showResult('success', `"${createdName}" was created.`);
        } catch (error: any) {
            console.error('Error creating shelf:', error);
            console.error('Error details:', JSON.stringify(error));
            hideCreateModal();
            if (error.message === 'Maximum 5 custom shelves reached') {
                showResult('error', 'You can only create up to 5 custom shelves.');
            } else {
                showResult('error', error.message || 'The shelf could not be created.');
            }
        }
    }

    

    function goToLibrary() {
        navigate({
            page: Home
        } as any);
    }

    function goToSettings() {
        navigate({
            page: Settings
        } as any);
    }
</script>

<style>
    .page {
        background-color: white;
    }

    .main-layout {
        width: 100%;
        height: 100%;
        background-color: white;
    }

    .header-container {
        padding: 20;
        background-color: #033047;
    }

    .header-title {
        font-size: 28;
        font-weight: bold;
        color: white;
        text-align: center;
        font-family: Milonga-Regular;
    }

    .scroll-container {
        padding: 20;
    }

    .content {
        margin-bottom: 80;
    }

    .shelf-item {
        padding: 20;
        margin-bottom: 15;
        background-color: white;
        border-width: 2;
        border-color: #033047;
        border-radius: 12;
        box-shadow: 0 2 8px rgba(0,0,0,0.1);
    }

    .shelf-item:active {
        background-color: #f8f8f8;
        opacity: 0.8;
    }

    .shelf-header {
        orientation: horizontal;
        margin-bottom: 10;
    }

    .shelf-name {
        font-size: 20;
        font-weight: bold;
        color: #033047;
        width: 70%;
    }

    .shelf-count {
        font-size: 14;
        color: #666;
        text-align: right;
        width: 30%;
    }

    .shelf-preview {
        padding-left: 10;
    }

    .preview-book {
        font-size: 14;
        color: #666;
        margin-bottom: 5;
        padding-left: 15;
    }

    .empty-text {
        font-size: 14;
        color: #999;
        font-style: italic;
        padding-left: 15;
    }

    .create-shelf-btn {
        width: 100%;
        padding: 15;
        margin-top: 10;
        background-color: #033047;
        color: white;
        font-size: 16;
        font-weight: bold;
        border-radius: 8;
        border-width: 0;
    }

    .max-shelves-notice {
        padding: 15;
        margin-top: 10;
        background-color: #fff3f0;
        border-radius: 8;
        border-width: 1;
        border-color: #ffccc7;
    }

    .notice-text {
        font-size: 14;
        color: #c62828;
        text-align: center;
    }

    .bottom-container-fixed {
        padding: 10 5;
        vertical-align: bottom;
        background-color: white;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
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
        font-size: 18;
        font-weight: bold;
        border-width: 2;
        border-radius: 4;
        border-color: #033047;
        margin: 0;
    }

    .nav-btn-active {
        background-color: #033047;
        color: white;
        border-width: 0;
    }

    /* Covers the whole page as a grid child spanning all rows; NativeScript
       does not support position: absolute, so the old rules did nothing. */
    .modal-overlay {
        background-color: rgba(0, 0, 0, 0.5);
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

    .shelf-input {
        font-size: 16;
        padding: 12;
        border-width: 1;
        border-color: #ccc;
        border-radius: 8;
        margin-bottom: 15;
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

    .result-success {
        color: #1b7f3b;
    }

    .result-error {
        color: #c62828;
    }

    .result-message {
        font-size: 16;
        color: #333;
        text-align: center;
    }

    .create-error {
        font-size: 14;
        color: #c62828;
        text-align: center;
        margin-top: 8;
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
</style>