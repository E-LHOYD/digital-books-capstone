<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, *, auto" columns="*" class="screen">
        <AppHeader row={0} back on:back={goBack} />

        <!--
            A grid, not a stack. The list used to be a fixed 450 tall inside a
            stack, which makes the content height independent of the screen: on
            anything shorter the buttons underneath fell off the bottom and were
            never drawn. Here the action row is `auto` so it claims its height
            first, and the list is `*` so it takes whatever is left.
        -->
        <gridLayout row={2} col={0} rows="auto, auto, *, auto" columns="*" class="container">
            <!-- Shelf Title -->
            <label row={0} col={0} text={shelfName} class="page-title" textWrap="true" />

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
            <scrollView row={2} col={0}>
                <stackLayout>
                    {#if books.length === 0}
                        <stackLayout class="empty-container">
                            <label text="No books in this shelf" class="empty-text" />
                        </stackLayout>
                    {:else}
                        {#each sortedBooks as book}
                            <gridLayout class="book-item" rows="auto, auto" columns="*, auto, auto" on:tap={() => onRowTap(book)}>
                                <label row={0} col={0} text={book.title} class="book-title" textWrap="true" />
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
                        <button text="Remove Books" class="btn btn-danger" on:tap={enterSelectionMode} />
                    {:else}
                        <label
                            text={selectionCount === 0
                                ? 'Tap books to select them'
                                : `${selectionCount} selected`}
                            class="selection-hint"
                        />
                        <gridLayout rows="auto" columns="*, 12, *" class="action-buttons">
                            <button col={0} text="Cancel" class="btn btn-secondary" on:tap={exitSelectionMode} />
                            <button
                                col={2}
                                text={removing ? 'Removing...' : 'Remove'}
                                class="btn btn-danger"
                                isEnabled={selectionCount > 0 && !removing}
                                on:tap={showRemoveDialog}
                            />
                        </gridLayout>
                    {/if}
                {/if}
            </stackLayout>
        </gridLayout>

        <!-- Remove Confirmation Modal -->
        {#if showRemoveModal}
            <gridLayout row={0} rowSpan={4} col={0} class="modal-overlay" on:tap={cancelRemove}>
                <stackLayout class="modal-content modal-compact" verticalAlignment="center" horizontalAlignment="center" on:tap={stopPropagation}>
                    <label text="Remove books?" class="modal-title" />

                    <label
                        text={`Are you sure you want to remove ${selectionCount} book${selectionCount === 1 ? '' : 's'} from this shelf?`}
                        class="modal-message"
                        textWrap="true"
                    />

                    <gridLayout rows="auto" columns="*, 10, *" class="modal-actions">
                        <button col={0} text="Cancel" class="btn btn-secondary compact-btn" on:tap={cancelRemove} />
                        <button col={2} text="Remove" class="btn btn-danger compact-btn" on:tap={confirmRemove} />
                    </gridLayout>
                </stackLayout>
            </gridLayout>
        {/if}

        <!-- Result -->
        {#if resultTitle}
            <gridLayout row={0} rowSpan={4} col={0} class="modal-overlay" on:tap={closeResult}>
                <stackLayout class="modal-content" verticalAlignment="center" horizontalAlignment="center" on:tap={stopPropagation}>
                    <label text={resultTitle} class="modal-title" />
                    <label text={resultMessage} class="modal-message" textWrap="true" />
                    <button text="OK" class="btn btn-primary" on:tap={closeResult} />
                </stackLayout>
            </gridLayout>
        {/if}

        <BottomNav row={3} active="shelf" />

    </gridLayout>
</page>

<script lang="ts">
    import AppHeader from './AppHeader.svelte';
    import BottomNav from './BottomNav.svelte';
    import { navigate } from '@nativescript-community/svelte-native';
    import MyShelf from './MyShelf.svelte';
    import BookDetails from './BookDetails.svelte';
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


</script>

<style>
    /* The remove confirmation: a small box with a short question, not a
       full-width dialog. */
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
        border-width: 2;
        border-color: #033047;
        border-radius: 100;
        padding: 6 14;
        margin-right: 8;
    }

    .sort-chip-active {
        background-color: #033047;
        color: #ffffff;
        border-color: #033047;
        font-weight: bold;
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

    .selection-hint {
        font-size: 13;
        color: #666;
        text-align: center;
        margin-bottom: 6;
    }

    .action-buttons {
        margin-top: 10;
        margin-bottom: 10;
    }

</style>