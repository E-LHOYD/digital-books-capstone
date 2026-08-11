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

                <!-- Create Shelf Button -->
                {#if customShelves.length < 5}
                    <button text="+ Create New Shelf" class="create-shelf-btn" on:tap={showCreateShelfDialog} />
                {:else}
                    <stackLayout class="max-shelves-notice">
                        <label text="Maximum 5 custom shelves reached" class="notice-text" />
                    </stackLayout>
                {/if}
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
    </gridLayout>
</page>

<script lang="ts">
    import { onMount } from 'svelte';
    import { firebase } from '@nativescript/firebase-core';
    import '@nativescript/firebase-firestore';
    import { navigate } from '@nativescript-community/svelte-native';
    // @ts-ignore
    import { Shelf, Book } from '../types';
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

    onMount(async () => {
        await loadUserData();
        await loadAllBooks();
    });

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
        return allBooks.filter(book => shelf.bookIds.includes(book.id || ''));
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
            shelfName = customShelves.find(s => s.id === shelfId)?.name || 'Shelf';
            books = getShelfBooks(customShelves.find(s => s.id === shelfId)!);
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
        // Simple prompt dialog for shelf name
        const prompt = require('@nativescript/core/ui/dialogs').prompt({
            title: 'Create New Shelf',
            message: 'Enter shelf name:',
            okButtonText: 'Create',
            cancelButtonText: 'Cancel',
            defaultText: '',
            inputType: 'text'
        }).then((result: any) => {
            if (result.result && result.text.trim()) {
                createShelf(result.text.trim());
            }
        });
    }

    async function createShelf(name: string) {
        if (!currentUserId) return;

        try {
            await createCustomShelf(currentUserId, name);
            // Reload shelves from Firestore to ensure it's saved
            await loadUserData();
            console.log('Shelf created successfully');
            alert('Shelf created successfully!');
        } catch (error: any) {
            console.error('Error creating shelf:', error);
            if (error.message === 'Maximum 5 custom shelves reached') {
                alert('You can only create up to 5 custom shelves.');
            } else {
                alert('Failed to create shelf. Please try again.');
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
</style>