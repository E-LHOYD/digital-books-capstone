<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, *, auto, auto" columns="*" class="screen">
        <!-- Header: back button + logo + wordmark -->
        <stackLayout row="0" orientation="horizontal" class="header">
            <button text="←" class="back-btn" on:tap={goBack} />
            <stackLayout orientation="horizontal" class="logo">
                <stackLayout class="bar bar-1" />
                <stackLayout class="bar bar-2" />
                <stackLayout class="bar bar-3" rotate="8" />
            </stackLayout>
            <label text="GD-Library" class="brand" />
        </stackLayout>
        <stackLayout row="1" class="divider" />

    <scrollView row={2} col={0}>
        <stackLayout class="container">

        <!-- Cover / First Page Preview -->
        {#if book.fileUrl && book.fileUrl.length > 0}
            <gridLayout class="detail-cover" rows="*" columns="*">
                <webView
                    src={getReaderUrl(book.fileUrl, { page: 1, preview: true })}
                    class="cover-webview"
                />
            </gridLayout>
        {:else}
            <stackLayout class="detail-cover">
                <label text="image" class="cover-text" />
            </stackLayout>
        {/if}

        <!-- Title -->
        <label text={book.title} class="detail-title" textWrap="true" />

        <!-- Author -->
        <label text={book.author} class="detail-author" />

        <!-- Subjects -->
        {#if book.subjects && book.subjects.length > 0}
            <stackLayout class="detail-subjects">
                <label text="Subjects:" class="subjects-label" />
                <label text={book.subjects.join(', ')} class="subjects-text" textWrap="true" />
            </stackLayout>
        {/if}

        <!-- Description -->
        <label text={book.detail || 'No description available'} textWrap="true" class="detail-description" />

        <!-- Published / Upload dates -->
        {#if book.publishedDate || book.releaseDate}
            <stackLayout class="detail-dates">
                {#if book.publishedDate}
                    <label text={`Published: ${formatDate(book.publishedDate)}`} class="detail-date" />
                {/if}
                {#if book.releaseDate}
                    <label text={`Uploaded: ${formatDate(book.releaseDate)}`} class="detail-date" />
                {/if}
            </stackLayout>
        {/if}

        <!-- Reading progress -->
        {#if readingPercent !== null}
            <stackLayout class="progress-line" orientation="horizontal">
                <label text={`${Math.round(readingPercent)}% read`} class="progress-percent" />
                {#if readingStatus}
                    <label text={readingStatus === 'read' ? ' · Read' : ' · Viewed'} class="progress-status" />
                {/if}
            </stackLayout>
        {/if}

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

        </stackLayout>
    </scrollView>

        <!-- Bottom Navigation -->
        <stackLayout row={3} col={0} class="bottom-container-fixed">
            <stackLayout orientation="horizontal" class="bottom-buttons">
                <stackLayout class="nav-btn" on:tap={goToLibrary}>
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

        <!-- Shelf Selection Modal -->
        {#if showShelfModal}
            <gridLayout row={0} rowSpan={5} col={0} class="modal-overlay" on:tap={hideShelfModal}>
                <stackLayout class="modal-content" verticalAlignment="center" horizontalAlignment="center" on:tap={stopPropagation}>
                    <label text="Select a Shelf" class="modal-title" />
                    
                    <scrollView class="shelf-list">
                        <stackLayout>
                            {#if loadingShelves}
                                <label text="Loading shelves…" class="empty-text" />
                            {:else if customShelves.length === 0}
                                <label text="No shelves yet. Create one below." class="empty-text" textWrap="true" />
                            {/if}
                            {#each customShelves as shelf (shelf.id)}
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

                    {#if shelfError}
                        <label text={shelfError} class="shelf-error" textWrap="true" />
                    {/if}

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
                                on:textChange={(e) => (newShelfName = e?.value ?? e?.object?.text ?? '')}
                            />
                            <stackLayout orientation="horizontal" class="form-actions">
                                <button text="Create" class="btn btn-confirm" on:tap={createNewShelf} />
                                <button text="Cancel" class="btn btn-cancel-small" on:tap={hideCreateShelfForm} />
                            </stackLayout>
                        </stackLayout>
                    {/if}
                </stackLayout>
            </gridLayout>
        {/if}

        <!-- Result Modal -->
        {#if resultKind}
            <gridLayout row={0} rowSpan={5} col={0} class="modal-overlay" on:tap={hideResult}>
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

        <!-- Bottom Navigation -->
        <stackLayout row={3} col={0} class="bottom-container-fixed">
            <stackLayout orientation="horizontal" class="bottom-buttons">
                <stackLayout class="nav-btn" on:tap={goToLibrary}>
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
    import { onMount } from 'svelte';
    import { navigate } from '@nativescript-community/svelte-native';
    import Home from './Home.svelte';
    import Reader from './Reader.svelte';
    import MyShelf from './MyShelf.svelte';
    import Profile from './Profile.svelte';
    import { isBookFileUrl, getReaderUrl } from '../services/storage.js';
    // @ts-ignore
    import { addBookToShelf, getCurrentUserId, getUserShelves, createCustomShelf } from '../services/shelf.js';
    // @ts-ignore
    import { getReadingProgress } from '../services/readingProgress.js';
    // @ts-ignore
    import type { Book } from '../types';

    // @ts-ignore
    export let book: Book;

    // A book is only readable if its Firestore document carries a usable
    // storage URL in `fileUrl`. The admin dashboard uploads it and writes it there.
    $: canRead = isBookFileUrl(book.fileUrl);

    // Dates are stored by the dashboard as YYYY-MM-DD strings. Formatted by
    // hand rather than with toLocaleDateString, which needs Intl support that
    // is not guaranteed in the Android runtime.
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    function formatDate(value: any): string {
        const m = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return String(value ?? '');
        const month = MONTHS[Number(m[2]) - 1];
        if (!month) return String(value);
        return `${month} ${Number(m[3])}, ${m[1]}`;
    }

    // Reading progress for this book, shown once there is something to show.
    let readingPercent: number | null = null;
    let readingStatus: string | null = null;

    onMount(async () => {
        try {
            const progress = await getReadingProgress(book.id);
            if (progress && typeof progress.percentage === 'number') {
                readingPercent = progress.percentage;
                readingStatus = progress.status || null;
            }
        } catch (error) {
            console.error('Error loading reading progress:', error);
        }
    });

    // Shelf modal state
    let showShelfModal = false;
    let showCreateForm = false;
    let shelves: any[] = [];
    let customShelves: any[] = [];
    let newShelfName = '';
    let loadingShelves = false;
    let shelfError = '';
    let resultKind: 'success' | 'error' | null = null;
    let resultMessage = '';

    function showResult(kind: 'success' | 'error', message: string) {
        resultKind = kind;
        resultMessage = message;
    }

    function hideResult() {
        resultKind = null;
        resultMessage = '';
    }

    // Load shelves when component mounts
    async function loadShelves() {
        loadingShelves = true;
        shelfError = '';
        try {
            const userId = getCurrentUserId();
            if (!userId) {
                shelfError = 'You must be signed in to use shelves.';
                shelves = [];
                customShelves = [];
                return;
            }
            shelves = await getUserShelves(userId);
            // Filter out 'read' and 'viewed' shelves, only show custom shelves
            customShelves = shelves.filter(shelf => shelf.id !== 'read' && shelf.id !== 'viewed');
        } catch (error: any) {
            // getUserShelves rethrows now, so a failure here is a real error
            // rather than "no shelves yet" and must not look like an empty list.
            console.error('Error loading shelves:', error);
            shelves = [];
            customShelves = [];
            shelfError = 'Could not load your shelves. ' + (error?.message || '');
        } finally {
            loadingShelves = false;
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

    function goToLibrary() {
        navigate({
            page: Home
        } as any);
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

    async function showShelfSelector() {
        showShelfModal = true;
        shelfError = '';
        // Awaited: previously the modal opened while this was still in flight,
        // so the list rendered empty and looked broken.
        await loadShelves();
    }

    function hideShelfModal() {
        showShelfModal = false;
        showCreateForm = false;
        newShelfName = '';
        shelfError = '';
    }

    function stopPropagation(event: any) {
        // NativeScript gesture events do not implement stopPropagation, so
        // calling it unguarded throws and swallows the tap.
        if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation();
        }
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
                shelfError = 'You must be signed in to add books to shelves.';
                return;
            }

            const bookId = book.id;

            if (!bookId) {
                shelfError = 'This book has no ID, so it cannot be added.';
                return;
            }

            const shelfName = shelves.find((s: any) => s.id === shelfId)?.name || 'shelf';
            await addBookToShelf(userId, shelfId, bookId);
            hideShelfModal();
            showResult('success', `"${book.title}" was added to ${shelfName}.`);
        } catch (error) {
            console.error('Error adding book to shelf:', error);
            if ((error as any).message === 'Book already in shelf') {
                shelfError = 'This book is already in that shelf.';
            } else {
                shelfError = 'Could not add the book. Please try again.';
            }
        }
    }

    async function createNewShelf() {
        shelfError = '';

        if (!newShelfName.trim()) {
            shelfError = 'Please enter a shelf name.';
            return;
        }

        try {
            const userId = getCurrentUserId();
            if (!userId) {
                shelfError = 'You must be signed in to create shelves.';
                return;
            }

            await createCustomShelf(userId, newShelfName.trim());

            // Stay in the selector with the new shelf listed, so the book can be
            // filed straight away rather than reopening the picker.
            await loadShelves();
            hideCreateShelfForm();
        } catch (error) {
            console.error('Error creating shelf:', error);
            if ((error as any).message === 'Maximum 5 custom shelves reached') {
                shelfError = 'You have reached the maximum of 5 custom shelves.';
            } else {
                shelfError = 'Could not create the shelf. Please try again.';
            }
        }
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

    .back-btn {
        font-size: 24;
        font-weight: bold;
        color: #033047;
        background-color: transparent;
        border-width: 0;
        padding: 0;
        margin-right: 15;
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

    .progress-line {
        margin-bottom: 16;
        horizontal-align: center;
    }

    .progress-percent {
        font-size: 15;
        font-weight: bold;
        color: #1b7f3b;
    }

    .progress-status {
        font-size: 15;
        color: #666;
    }

    .shelf-error {
        font-size: 14;
        color: #c62828;
        text-align: center;
        margin-top: 8;
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

    .container {
        padding: 28 20 0 20;
        align-items: center;
    }

    .detail-cover {
        width: 200;
        height: 280;
        border-radius: 0;
        margin-bottom: 20;
        background-color: #f0f0f0;
        justify-content: center;
        align-items: center;
        overflow: hidden;
    }

    .cover-webview {
        width: 100%;
        height: 100%;
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

    .detail-subjects {
        margin-bottom: 20;
        padding: 0 10;
    }

    .subjects-label {
        font-size: 14;
        font-weight: bold;
        color: #033047;
        margin-bottom: 5;
    }

    .subjects-text {
        font-size: 16;
        color: #666;
    }

    .detail-description {
        font-size: 16;
        color: #333;
        margin-bottom: 12;
        padding: 0 10;
        text-align: center;
    }

    .detail-dates {
        margin-bottom: 30;
    }

    .detail-date {
        font-size: 14;
        color: #666;
        text-align: center;
        margin-bottom: 2;
    }

    .buttons-row {
        margin-bottom: 20;
    }

    .btn {
        font-size: 18;
        font-weight: bold;
        border-radius: 0;
        border-width: 0;
        margin: 0 5;
    }

    .btn-primary {
        background-color: #033047;
        color: white;
        padding: 13 28;
    }

    .btn-secondary {
        background-color: #f0f0f0;
        color: #033047;
        border-width: 2;
        border-color: #201e1d;
        padding: 13 28;
    }

    .notice {
        padding: 12;
        background-color: #fff3f0;
        border-radius: 0;
        margin-bottom: 20;
        width: 100%;
        border-width: 2;
        border-color: #ffccc7;
    }

    .notice-text {
        font-size: 14;
        color: #c62828;
        text-align: center;
    }

    /* Covers the page as a grid child; NativeScript ignores position: absolute,
       which is why this used to sit in the content flow instead of over it. */
    .modal-overlay {
        background-color: rgba(0, 0, 0, 0.5);
    }

    .modal-content {
        background-color: white;
        border-radius: 0;
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
        border-width: 2;
        border-color: #201e1d;
        border-radius: 0;
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
        border-radius: 0;
        border-width: 0;
        margin: 0 5;
    }

    .btn-cancel {
        background-color: #f0f0f0;
        color: #033047;
        font-size: 16;
        font-weight: bold;
        padding: 12 20;
        border-radius: 0;
        border-width: 2;
        border-color: #033047;
        margin: 0 5;
    }

    .create-form {
        margin-top: 15;
        padding-top: 15;
        border-width: 2;
        border-color: #201e1d;
        border-radius: 0;
    }

    .shelf-input {
        font-size: 16;
        padding: 12;
        border-width: 2;
        border-color: #201e1d;
        border-radius: 0;
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
        border-radius: 0;
        border-width: 0;
        margin: 0 5;
    }

    .btn-cancel-small {
        background-color: #f0f0f0;
        color: #033047;
        font-size: 16;
        font-weight: bold;
        padding: 10 20;
        border-radius: 0;
        border-width: 2;
        border-color: #033047;
        margin: 0 5;
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