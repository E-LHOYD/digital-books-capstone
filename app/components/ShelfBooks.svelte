<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, *, auto" columns="*" class="screen">
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

        <!--
            A grid, not a stack. The list used to be a fixed 450 tall inside a
            stack, which makes the content height independent of the screen: on
            anything shorter the buttons underneath fell off the bottom and were
            never drawn. Here the action row is `auto` so it claims its height
            first, and the list is `*` so it takes whatever is left.
        -->
        <gridLayout row={2} col={0} rows="auto, auto, *, auto" columns="*" class="container">
            <!-- Shelf Title -->
            <label row={0} col={0} text={shelfName} class="shelf-title" />

            <!-- Sort -->
            <scrollView row={1} col={0} orientation="horizontal" class="sort-scroll">
                <stackLayout orientation="horizontal" class="sort-row">
                    {#each SORT_OPTIONS as option}
                        <label
                            text={option.key === sortKey
                                ? `${option.label} ${sortDir === 'asc' ? '\u2191' : '\u2193'}`
                                : option.label}
                            class="sort-chip"
                            class:sort-chip-active={option.key === sortKey}
                            on:tap={() => chooseSort(option.key)}
                        />
                    {/each}
                </stackLayout>
            </scrollView>

            <!-- Books List -->
            <scrollView row={2} col={0} class="books-scroll">
                <stackLayout>
                    {#if books.length === 0}
                        <stackLayout class="empty-container">
                            <label text="No books in this shelf" class="empty-text" />
                        </stackLayout>
                    {:else}
                        {#each sortedBooks as book}
                            <gridLayout class="book-item" rows="auto, auto" columns="*, auto, auto" on:tap={() => onRowTap(book)}>
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
                                {#if canRemove && selectionMode}
                                    <button
                                        row={0}
                                        col={2}
                                        rowSpan={2}
                                        text={selectedBooks.includes(book.id) ? "✓" : "○"}
                                        class="select-checkbox"
                                        style={selectedBooks.includes(book.id)
                                            ? "color: #1b7f3b;"
                                            : "color: #033047;"}
                                        on:tap={toggleBookSelection.bind(null, book)}
                                        verticalAlignment="center"
                                    />
                                {/if}
                            </gridLayout>
                        {/each}
                    {/if}
                </stackLayout>
            </scrollView>

            <!-- Remove from shelf (custom shelves only) -->
            <stackLayout row={3} col={0}>
                {#if canRemove && books.length > 0}
                    {#if !selectionMode}
                        <button text="Remove Books" class="remove-btn" on:tap={enterSelectionMode} />
                    {:else}
                        <label
                            text={selectionCount === 0
                                ? 'Tap books to select them'
                                : `${selectionCount} selected`}
                            class="selection-hint"
                        />
                        <stackLayout orientation="horizontal" class="action-buttons">
                            <button text="Cancel" class="action-btn btn-cancel" on:tap={exitSelectionMode} />
                            <button
                                text={removing ? 'Removing...' : 'Remove'}
                                class="action-btn btn-danger"
                                isEnabled={selectionCount > 0 && !removing}
                                on:tap={showRemoveDialog}
                            />
                        </stackLayout>
                    {/if}
                {/if}
            </stackLayout>
        </gridLayout>

        <!-- Remove Confirmation Modal -->
        {#if showRemoveModal}
            <gridLayout row={0} rowSpan={3} col={0} class="modal-overlay" on:tap={cancelRemove}>
                <stackLayout class="modal-content" verticalAlignment="center" horizontalAlignment="center" on:tap={stopPropagation}>
                    <label text="Remove Books" class="modal-title" />

                    <label
                        text={`Are you sure you want to remove ${selectionCount} book${selectionCount === 1 ? '' : 's'} from this shelf?`}
                        class="modal-message"
                        textWrap="true"
                    />

                    <stackLayout orientation="horizontal" class="modal-actions">
                        <button text="Cancel" class="btn btn-cancel" on:tap={cancelRemove} />
                        <button text="Remove" class="btn btn-danger" on:tap={confirmRemove} />
                    </stackLayout>
                </stackLayout>
            </gridLayout>
        {/if}

        <!-- Result -->
        {#if resultTitle}
            <gridLayout row={0} rowSpan={3} col={0} class="modal-overlay" on:tap={closeResult}>
                <stackLayout class="modal-content" verticalAlignment="center" horizontalAlignment="center" on:tap={stopPropagation}>
                    <label text={resultTitle} class="modal-title" />
                    <label text={resultMessage} class="modal-message" textWrap="true" />
                    <button text="OK" class="btn btn-ok" on:tap={closeResult} />
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
                <stackLayout class="nav-btn nav-btn-active">
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
    import { navigate } from '@nativescript-community/svelte-native';
    import MyShelf from './MyShelf.svelte';
    import BookDetails from './BookDetails.svelte';
    import Profile from './Profile.svelte';
    import Home from './Home.svelte';
    // @ts-ignore
    import type { Book } from '../types';
    // @ts-ignore
    import { sortBooks, toTimestamp } from '../services/sortBooks.js';
    // @ts-ignore
    import { getCurrentUserId, removeBooksFromShelf } from '../services/shelf.js';

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
    // @ts-ignore
    export let isHistoryShelf: boolean = false;

    // Sorting. Each option carries the direction that is useful first: titles
    // read best A-Z, but the most-read and most-recently-opened books are the
    // ones worth seeing at the top.
    const SORT_OPTIONS = [
        { key: 'title', label: 'Title', value: (b: any) => b.title, firstDir: 'asc' },
        { key: 'author', label: 'Author', value: (b: any) => b.author, firstDir: 'asc' },
        {
            key: 'progress',
            label: 'Progress',
            value: (b: any) => (typeof b.percentage === 'number' ? b.percentage : null),
            firstDir: 'desc'
        },
        {
            key: 'published',
            label: 'Published',
            // Falls back to the release date for books uploaded before the
            // dashboard collected a published date.
            value: (b: any) => b.publishedDate || b.releaseDate,
            firstDir: 'desc'
        },
        {
            key: 'opened',
            label: 'Last opened',
            value: (b: any) => toTimestamp(b.lastOpenedAt),
            firstDir: 'desc'
        }
    ];

    let sortKey = 'title';
    let sortDir = 'asc';

    function chooseSort(key: string) {
        if (sortKey === key) {
            sortDir = sortDir === 'asc' ? 'desc' : 'asc';
            return;
        }
        const option = SORT_OPTIONS.find((o) => o.key === key);
        sortKey = key;
        sortDir = option ? option.firstDir : 'asc';
    }

    $: sortedBooks = (() => {
        const option = SORT_OPTIONS.find((o) => o.key === sortKey);
        return option ? sortBooks(books, option.value, sortDir) : books;
    })();

    let selectedBooks: string[] = [];
    let showRemoveModal = false;
    let selectionCount = 0;
    let selectionMode = false;
    let removing = false;
    let resultTitle = '';
    let resultMessage = '';

    // Read, Viewed and Reading history are worked out from reading progress
    // rather than stored, so there is no shelf document to take a book off.
    $: canRemove = !isReadShelf && !isViewedShelf && !isHistoryShelf;

    function toggleBookSelection(book: any) {
        if (selectedBooks.includes(book.id)) {
            selectedBooks = selectedBooks.filter(id => id !== book.id);
        } else {
            selectedBooks = [...selectedBooks, book.id];
        }
        selectionCount = selectedBooks.length;
    }

    // While selecting, the whole row is the checkbox. Opening a book from a row
    // being ticked is never what was meant, and the tick itself is a small
    // target at the far edge of the screen.
    function onRowTap(book: any) {
        if (canRemove && selectionMode) {
            toggleBookSelection(book);
            return;
        }
        goToBookDetails(book);
    }

    function enterSelectionMode() {
        selectionMode = true;
        selectedBooks = [];
        selectionCount = 0;
    }

    function exitSelectionMode() {
        selectionMode = false;
        selectedBooks = [];
        selectionCount = 0;
    }

    function showRemoveDialog() {
        if (selectionCount === 0) return;
        showRemoveModal = true;
    }

    function cancelRemove() {
        showRemoveModal = false;
        // Keep selection mode active when canceling the modal
    }

    function closeResult() {
        resultTitle = '';
        resultMessage = '';
    }

    function stopPropagation(event: any) {
        if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation();
        }
    }

    async function confirmRemove() {
        const ids = selectedBooks.slice();
        const removed = ids.length;

        showRemoveModal = false;
        removing = true;

        try {
            const userId = getCurrentUserId();

            if (!userId) {
                throw new Error('You are not signed in.');
            }

            await removeBooksFromShelf(userId, shelfId, ids);

            // The shelf on screen is this component's own copy, so it is updated
            // here too. Previously the books were only ever removed on screen,
            // and only by navigating away: nothing was written, and the message
            // claiming otherwise was shown before anything had been attempted.
            books = books.filter((book) => !ids.includes(book.id));

            exitSelectionMode();

            resultTitle = 'Removed';
            resultMessage = `${removed} book${removed === 1 ? '' : 's'} removed from ${shelfName}. `
                + 'They are still in the library and keep their reading progress.';
        } catch (error) {
            console.error('Error removing books:', error);
            resultTitle = 'Could not remove';
            resultMessage = 'The books are still on the shelf. Please try again.';
        } finally {
            removing = false;
        }
    }

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

    function goToLibrary() {
        navigate({
            page: Home
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

    .back-btn {
        font-size: 24;
        font-weight: bold;
        color: #033047;
        background-color: transparent;
        border-width: 0;
        padding: 0;
        margin-right: 15;
        vertical-align: center;
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

    .container {
        padding: 28 20 0 20;
    }

    .shelf-title {
        font-size: 34;
        font-weight: bold;
        font-family: Archivo, sans-serif;
        color: #201e1d;
        text-align: left;
        margin-bottom: 24;
    }

    .books-scroll {
        border-width: 2;
        border-color: #201e1d;
        border-radius: 0;
        margin-bottom: 15;
    }

    .book-item {
        padding: 15;
        border-bottom-width: 1;
        border-bottom-color: #f0f0f0;
        margin: 5 0;
        background-color: white;
        border-radius: 0;
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

    .sort-scroll {
        margin-bottom: 12;
    }

    .sort-row {
        padding: 2 0;
    }

    .sort-chip {
        font-size: 13;
        color: #033047;
        background-color: #ffffff;
        border-width: 1;
        border-color: #cccccc;
        border-radius: 0;
        padding: 6 12;
        margin-right: 8;
    }

    .sort-chip-active {
        background-color: #033047;
        color: #ffffff;
        border-color: #033047;
        font-weight: bold;
    }

    .book-title {
        font-size: 18;
        font-weight: bold;
        color: #033047;
        margin-bottom: 5;
        text-transform: capitalize;
    }

    .book-author {
        font-size: 14;
        color: #666;
    }

    .select-checkbox {
        font-size: 20;
        font-weight: bold;
        color: #033047;
        background-color: transparent;
        border-width: 0;
        padding: 0;
        margin-left: 10;
        width: 30;
        height: 30;
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

    .selection-hint {
        font-size: 13;
        color: #666;
        text-align: center;
        margin-bottom: 6;
    }

    .btn-ok {
        background-color: #033047;
        color: white;
        border-width: 0;
        margin-top: 5;
    }

    .remove-btn {
        width: 100%;
        padding: 15;
        background-color: #c62828;
        color: white;
        font-size: 16;
        font-weight: bold;
        border-radius: 0;
        border-width: 0;
        margin-top: 10;
        margin-bottom: 10;
    }

    .action-buttons {
        orientation: horizontal;
        margin-top: 10;
        margin-bottom: 10;
    }

    .action-btn {
        width: 50%;
        padding: 15;
        font-size: 16;
        font-weight: bold;
        border-radius: 0;
        border-width: 0;
        margin: 0;
    }

    .action-btn.btn-cancel {
        background-color: #f0f0f0;
        color: #033047;
        border-width: 2;
        border-color: #033047;
    }

    .action-btn.btn-danger {
        background-color: #c62828;
        color: white;
    }

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

    .modal-message {
        font-size: 16;
        color: #333;
        text-align: center;
        margin-bottom: 20;
    }

    .modal-actions {
        margin-top: 15;
    }

    .btn {
        padding: 12 20;
        border-radius: 0;
        font-size: 16;
        font-weight: bold;
        margin: 0 5;
    }

    .btn-cancel {
        background-color: #f0f0f0;
        color: #033047;
        border-width: 2;
        border-color: #033047;
    }

    .btn-danger {
        background-color: #c62828;
        color: white;
        border-width: 0;
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