<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, *, auto" columns="*" class="screen">
        <AppHeader row={0} />
        
        <!-- Main Content -->
        <scrollView row={2} col={0}>
            <stackLayout class="container">
                <label text="My Shelf" class="page-title" />

                <!-- Reading History Shelf (combined read + viewed) -->
                <gridLayout columns="*, auto" rows="auto, auto" class="card" on:tap={() => goToShelfBooks('history')}>
                    <label row={0} col={0} text="📖 Reading History" class="card-title" />
                    <label row={0} col={1} text={(readBooks.length + viewedBooks.length) + ' books'} class="muted-text" verticalAlignment="center" />
                    <label
                        row={1}
                        col={0}
                        colSpan={2}
                        text={(readBooks.length + viewedBooks.length) > 0 ? 'Tap to view books' : 'No reading history yet'}
                        class="muted-text"
                    />
                </gridLayout>

                <!-- Create Shelf Button -->
                {#if customShelves.length < MAX_CUSTOM_SHELVES}
                    <button text="+ Create New Shelf" class="btn btn-primary create-shelf-btn" on:tap={showCreateShelfDialog} />
                {:else}
                    <label text={SHELF_LIMIT_MESSAGE} class="muted-text limit-text" textWrap="true" />
                {/if}

                <!-- Custom Shelves -->
                {#if customShelves.length > 0}
                    <label text="Created shelves" class="section-title" />
                {/if}
                {#each customShelves as shelf}
                    <gridLayout class="card" rows="auto, auto" columns="*, auto">
                        <label row={0} col={0} text={shelf.name} class="card-title" on:tap={() => goToShelfBooks(shelf.id)} />
                        <label
                            row={1}
                            col={0}
                            text={(shelf.bookIds?.length || 0) > 0
                                ? `${shelf.bookIds.length} book${shelf.bookIds.length === 1 ? '' : 's'} · tap to view`
                                : 'Empty shelf'}
                            class="muted-text"
                            on:tap={() => goToShelfBooks(shelf.id)}
                        />
                        <button
                            row={0}
                            col={1}
                            rowSpan={2}
                            text="Delete"
                            class="shelf-delete-btn"
                            verticalAlignment="center"
                            on:tap={() => confirmDeleteShelf(shelf)}
                        />
                    </gridLayout>
                {/each}
            </stackLayout>
        </scrollView>

        <BottomNav row={3} active="shelf" home />

        <!-- Create Shelf Modal -->
        {#if showCreateModal}
            <gridLayout row={0} rowSpan={4} col={0} class="modal-overlay" on:tap={hideCreateModal}>
                <stackLayout class="modal-content" verticalAlignment="center" horizontalAlignment="center" on:tap={stopPropagation}>
                    <label text="Create New Shelf" class="modal-title" />
                    
                    <textField 
                        hint="Shelf name" 
                        class="input" 
                        text={newShelfName}
                        on:textChange={(e) => (newShelfName = e?.value ?? e?.object?.text ?? '')}
                    />
                    
                    {#if createError}
                        <label text={createError} class="create-error" textWrap="true" />
                    {/if}

                    <gridLayout rows="auto" columns="*, 12, *" class="modal-actions">
                        <button col={0} text="Create" class="btn btn-primary" on:tap={createShelf} />
                        <button col={2} text="Cancel" class="btn btn-secondary" on:tap={hideCreateModal} />
                    </gridLayout>
                </stackLayout>
            </gridLayout>
        {/if}

        <!-- Delete Confirmation Modal -->
        {#if pendingDelete}
            <gridLayout row={0} rowSpan={4} col={0} class="modal-overlay" on:tap={cancelDeleteShelf}>
                <stackLayout class="modal-content modal-compact" verticalAlignment="center" horizontalAlignment="center" on:tap={stopPropagation}>
                    <label text="Delete shelf?" class="modal-title result-error" />

                    <label
                        text={`"${pendingDelete.name}" will be removed. The books in it are not deleted.`}
                        class="modal-message"
                        textWrap="true"
                    />

                    <!-- Same order as removing books: Cancel, then the red action. -->
                    <gridLayout rows="auto" columns="*, 10, *" class="modal-actions">
                        <button col={0} text="Cancel" class="btn btn-secondary compact-btn" isEnabled={!deleting} on:tap={cancelDeleteShelf} />
                        <button col={2} text="Delete" class="btn btn-danger compact-btn" isEnabled={!deleting} on:tap={performDeleteShelf} />
                    </gridLayout>
                </stackLayout>
            </gridLayout>
        {/if}

        <!-- Result Modal -->
        {#if resultKind}
            <gridLayout row={0} rowSpan={4} col={0} class="modal-overlay" on:tap={hideResult}>
                <stackLayout class="modal-content" verticalAlignment="center" horizontalAlignment="center" on:tap={stopPropagation}>
                    <label
                        text={resultKind === 'success' ? 'Success' : 'Something went wrong'}
                        class="modal-title {resultKind === 'success' ? 'result-success' : 'result-error'}"
                    />

                    <label text={resultMessage} class="result-message" textWrap="true" />

                    <stackLayout class="modal-actions">
                        <button text="OK" class="btn btn-primary" on:tap={hideResult} />
                    </stackLayout>
                </stackLayout>
            </gridLayout>
        {/if}
    </gridLayout>
</page>

<script lang="ts">
    import AppHeader from './AppHeader.svelte';
    import BottomNav from './BottomNav.svelte';
    import { onMount, onDestroy } from 'svelte';
    import { firebase } from '@nativescript/firebase-core';
    import '@nativescript/firebase-firestore';
    import { navigate } from '@nativescript-community/svelte-native';
    // @ts-ignore
    import type { Shelf, Book } from '../types';
    import ShelfBooks from './ShelfBooks.svelte';
    import { Auth } from '@nativescript/firebase-auth';
    // @ts-ignore
    import { getUserShelves, createCustomShelf, deleteCustomShelf, getCurrentUserId, MAX_CUSTOM_SHELVES, SHELF_LIMIT_MESSAGE } from '../services/shelf.js';
    // @ts-ignore
    import { getAllReadingProgress } from '../services/readingProgress.js';
    // @ts-ignore
    import { recordActivity } from '../services/presence.js';

    let customShelves: any[] = [];
    let readBooks: any[] = [];
    let viewedBooks: any[] = [];
    let allBooks: any[] = [];
    let progressByBook: Record<string, any> = {};
    let currentUserId: string | null = null;
    let showCreateModal = false;
    let newShelfName = '';
    // Validation problems stay inside the create modal so the name can be
    // corrected without losing it; the outcome of a submit gets its own modal.
    let createError = '';
    let resultKind: 'success' | 'error' | null = null;
    let resultMessage = '';
    // Held rather than acted on immediately: deleting a shelf is not undoable.
    let pendingDelete: any = null;
    let deleting = false;

    let auth: any = null;
    let authListener: any = null;
    let loadedForUid: string | null = null;

    onMount(() => {
        console.log('MyShelf component mounted');
        recordActivity();

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
        // on first open. Progress comes next, so the shelf lists can be built
        // with each book's percentage already attached.
        await loadAllBooks();
        await loadProgress();
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
                    publishedDate: data.publishedDate || null,
                    releaseDate: data.releaseDate || null,
                    coverPath: `~/ebooks/cover/${data.title.replace(/\s+/g, '').toLowerCase()}cover.jpg`,
                    coverUrl: data.coverUrl || null,
                };
            });
        } catch (error) {
            console.error('Error loading all books:', error);
        }
    }

    // One query for every book's progress, rather than one per book.
    async function loadProgress() {
        try {
            const list = await getAllReadingProgress();
            const map: Record<string, any> = {};
            for (const entry of list || []) {
                if (entry?.bookId) map[entry.bookId] = entry;
            }
            progressByBook = map;
        } catch (error) {
            console.error('Error loading reading progress:', error);
            progressByBook = {};
        }
    }

    function percentFor(book: any): number | null {
        const entry = progressByBook[book?.id || ''];
        return entry && typeof entry.percentage === 'number' ? entry.percentage : null;
    }

    /** When the book was last opened, for the shelf page's sort. */
    function lastOpenedFor(book: any): any {
        const entry = progressByBook[book?.id || ''];
        return entry?.lastReadAt ?? null;
    }

    // Progress and last-opened are attached to the book objects themselves so
    // the shelf page, which receives them as a prop, can show and sort by them
    // without refetching.
    function withProgress(books: any[]): any[] {
        return books.map((book) => ({
            ...book,
            percentage: percentFor(book),
            lastOpenedAt: lastOpenedFor(book)
        }));
    }

    async function loadReadBooks(bookIds: string[]) {
        try {
            readBooks = withProgress(allBooks.filter(book => bookIds.includes(book.id || '')));
        } catch (error) {
            console.error('Error loading read books:', error);
        }
    }

    async function loadViewedBooks(bookIds: string[]) {
        try {
            viewedBooks = withProgress(allBooks.filter(book => bookIds.includes(book.id || '')));
        } catch (error) {
            console.error('Error loading viewed books:', error);
        }
    }

    function getShelfBooks(shelf: any): any[] {
        const ids = shelf?.bookIds || [];
        // Enriched like the Read and Viewed lists, so opening a custom shelf
        // shows percentages rather than a bare list.
        return withProgress(allBooks.filter(book => ids.includes(book.id || '')));
    }

    function goToShelfBooks(shelfId: string) {
        const isReadShelf = shelfId === 'read';
        const isViewedShelf = shelfId === 'viewed';
        const isHistoryShelf = shelfId === 'history';
        let shelfName = 'Shelf';
        let books: any[] = [];

        if (isReadShelf) {
            shelfName = 'Read';
            books = readBooks;
        } else if (isViewedShelf) {
            shelfName = 'Viewed';
            books = viewedBooks;
        } else if (isHistoryShelf) {
            shelfName = 'Reading History';
            // Combine read and viewed books, removing duplicates
            const combinedMap = new Map();
            [...readBooks, ...viewedBooks].forEach(book => {
                if (book?.id) combinedMap.set(book.id, book);
            });
            books = Array.from(combinedMap.values());
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
                isViewedShelf,
                isHistoryShelf
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

    function confirmDeleteShelf(shelf: any) {
        pendingDelete = shelf;
    }

    function cancelDeleteShelf() {
        if (deleting) return;
        pendingDelete = null;
    }

    async function performDeleteShelf() {
        if (!pendingDelete || !currentUserId || deleting) return;

        const shelf = pendingDelete;
        deleting = true;

        try {
            await deleteCustomShelf(currentUserId, shelf.id);
            pendingDelete = null;
            await loadUserData();
            customShelves = customShelves;
            showResult('success', `"${shelf.name}" was deleted.`);
        } catch (error: any) {
            console.error('Error deleting shelf:', error);
            pendingDelete = null;
            showResult('error', error?.message || 'The shelf could not be deleted.');
        } finally {
            deleting = false;
        }
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
        // NativeScript gesture events do not implement stopPropagation, so
        // calling it unguarded throws and swallows the tap.
        if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation();
        }
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
            if (error.message === SHELF_LIMIT_MESSAGE) {
                showResult('error', `You can only create up to ${MAX_CUSTOM_SHELVES} custom shelves.`);
            } else {
                showResult('error', error.message || 'The shelf could not be created.');
            }
        }
    }

    


</script>

<style>
    /* The delete confirmation: a small box with a short question, the same
       size as the one for removing books from a shelf. */
    .modal-compact {
        width: 72%;
        padding: 12 14;
    }

    .modal-compact .modal-title {
        font-size: 16;
        margin-bottom: 4;
    }

    .modal-compact .modal-message {
        font-size: 13;
        margin-bottom: 0;
    }

    .modal-compact .modal-actions {
        margin-top: 8;
    }

    .compact-btn {
        height: 36;
        margin: 0;
        font-size: 14;
        padding: 0 10;
    }

    .create-shelf-btn {
        margin: 12 0 4 0;
    }

    .limit-text {
        text-align: center;
        margin: 12 0 4 0;
    }

    /* A small red outlined button with a bin, the app's button shape, so it
       reads as a button and as the one that takes something away. */
    .shelf-delete-btn {
        background-color: white;
        color: #b3261e;
        font-size: 13;
        font-weight: bold;
        border-width: 2;
        border-color: #b3261e;
        border-radius: 100;
        height: 34;
        padding: 0 12;
        margin: 0 0 0 12;
        text-transform: none;
    }

    .shelf-delete-btn:highlighted {
        background-color: #b3261e;
        color: white;
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

</style>