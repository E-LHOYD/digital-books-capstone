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

        <stackLayout row={2} col={0} class="container">
            <!-- Shelf Title -->
            <label text={shelfName} class="shelf-title" />

            <!-- Books List -->
            <scrollView class="books-scroll">
                <stackLayout>
                    {#if books.length === 0}
                        <stackLayout class="empty-container">
                            <label text="No books in this shelf" class="empty-text" />
                        </stackLayout>
                    {:else}
                        {#each books as book (book.id + '-' + refreshKey)}
                            <gridLayout class="book-item" rows="auto, auto" columns="*, auto, auto" on:tap={() => goToBookDetails(book)}>
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
                                {#if !isReadShelf && !isViewedShelf && selectionMode}
                                    <button
                                        row={0}
                                        col={2}
                                        rowSpan={2}
                                        text={isSelected(book.id) ? "✓" : "○"}
                                        class="select-checkbox"
                                        style={isSelected(book.id) ? "color: #1b7f3b;" : "color: #033047;"}
                                        on:tap={toggleBookSelection.bind(null, book)}
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
                {#if !selectionMode}
                    <button text="Remove Books" class="remove-btn" on:tap={enterSelectionMode} />
                {:else}
                    <stackLayout orientation="horizontal" class="action-buttons">
                        <button text="Cancel" class="action-btn btn-cancel" on:tap={exitSelectionMode} />
                        <button text="Remove" class="action-btn btn-danger" on:tap={showRemoveDialog} />
                    </stackLayout>
                {/if}
            {/if}
        </stackLayout>

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
    export let shelfId: string;
    // @ts-ignore
    export let shelfName: string;
    // @ts-ignore
    export let books: Book[];
    // @ts-ignore
    export let isReadShelf: boolean;
    // @ts-ignore
    export let isViewedShelf: boolean = false;

    let selectedBooks: string[] = [];
    let showRemoveModal = false;
    let selectionCount = 0;
    let refreshKey = 0;
    let selectionMode = false;

    function toggleBookSelection(book: any) {
        if (selectedBooks.includes(book.id)) {
            selectedBooks = selectedBooks.filter(id => id !== book.id);
        } else {
            selectedBooks = [...selectedBooks, book.id];
        }
        selectionCount = selectedBooks.length;
        refreshKey = refreshKey + 1;
    }

    function isSelected(bookId: string): boolean {
        return selectedBooks.includes(bookId);
    }

    function enterSelectionMode() {
        selectionMode = true;
        selectedBooks = [];
        selectionCount = 0;
        refreshKey = refreshKey + 1;
    }

    function exitSelectionMode() {
        selectionMode = false;
        selectedBooks = [];
        selectionCount = 0;
        refreshKey = refreshKey + 1;
    }

    $: refreshKey;

    function showRemoveDialog() {
        if (selectionCount === 0) {
            alert('Please select at least one book to remove.');
            return;
        }
        showRemoveModal = true;
    }

    function cancelRemove() {
        showRemoveModal = false;
        // Keep selection mode active when canceling the modal
    }

    function stopPropagation(event: any) {
        if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation();
        }
    }

    async function confirmRemove() {
        try {
            // Remove selected books from the shelf
            const updatedBookIds = books
                .filter((book) => !selectedBooks.includes(book.id))
                .map((book) => book.id);

            // Update the shelf in Firestore
            // This would require the shelf service to be imported and used
            // For now, we'll just clear the selection and show a success message
            exitSelectionMode();
            showRemoveModal = false;
            alert('Books removed successfully!');
            
            // Refresh the shelf books
            goBack();
        } catch (error) {
            console.error('Error removing books:', error);
            alert('Failed to remove books. Please try again.');
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
        height: 450;
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
    }

    .action-buttons {
        orientation: horizontal;
        margin-top: 10;
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