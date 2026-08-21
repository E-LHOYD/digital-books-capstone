<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, *, auto" columns="*" class="main-layout">
        <!-- Header -->
        <gridLayout row={0} col={0} rows="auto" columns="auto, *" class="header">
            <button row={0} col={0} text="Back" class="back-btn" on:tap={goBack} />
            <label row={0} col={1} text="Browsing" class="header-title" />
        </gridLayout>

        <!-- Search Bar -->
        <stackLayout row={1} col={0} class="search-container">
            <gridLayout rows="auto" columns="*, auto">
                <textField
                    row={0}
                    col={0}
                    hint="Search title or author"
                    class="search-bar"
                    text={searchQuery}
                    on:textChange={(e) => (searchQuery = e?.value ?? e?.object?.text ?? '')}
                />
                {#if searchQuery}
                    <button row={0} col={1} text="Clear" class="search-clear" on:tap={clearSearch} />
                {/if}
            </gridLayout>
        </stackLayout>

        <!-- Main Content -->
        <stackLayout row={2} col={0} class="container">
            <stackLayout orientation="horizontal" class="buttons-container">
                <button text="Subjects" class="subjects-btn" on:tap={goToSubjects} />
            </stackLayout>

            <!-- Books List -->
            <scrollView class="books-scroll">
                <stackLayout>
                    {#if isLoading}
                        <stackLayout class="loading-container">
                            <label text="Loading books..." class="loading-text" />
                        </stackLayout>
                    {:else if error}
                        <stackLayout class="error-container">
                            <label text={error} class="error-text" />
                            <button text="Retry" class="retry-btn" on:tap={loadBooks} />
                        </stackLayout>
                    {:else if books.length === 0}
                        <stackLayout class="empty-container">
                            <label text="No books found" class="empty-text" />
                        </stackLayout>
                    {:else if filteredBooks.length === 0}
                        <stackLayout class="empty-container">
                            <label
                                text={`Nothing matches "${searchQuery}"`}
                                class="empty-text"
                                textWrap="true"
                            />
                            <button text="Clear search" class="retry-btn" on:tap={clearSearch} />
                        </stackLayout>
                    {:else}
                        {#each filteredBooks as book (book.id)}
							<stackLayout class="book-item" on:tap={() => goToBookDetails(book)}>
								
								<!-- Book Info -->
								<stackLayout class="book-info">
									<label text={book.title} class="book-title" />
									<label text={book.author} class="book-author" />
								</stackLayout>

							</stackLayout>
						{/each}
                    {/if}
                </stackLayout>
            </scrollView>
        </stackLayout>

        <!-- Bottom Buttons - Fixed at bottom -->
        <stackLayout row={3} col={0} class="bottom-container-fixed">
            <stackLayout orientation="horizontal" class="bottom-buttons">
                <button text="Library" class="nav-btn" on:tap={goToLibrary} />
                <button text="My Shelf" class="nav-btn" on:tap={goToMyShelf} />
                <button text="Profile" class="nav-btn" on:tap={goToProfile} />
            </stackLayout>
        </stackLayout>
    </gridLayout>
</page>

<script lang="ts">
    import { onMount } from 'svelte';
    import { firebase } from '@nativescript/firebase-core';
	import '@nativescript/firebase-firestore';
    import { navigate } from '@nativescript-community/svelte-native';
    import BookDetails from './BookDetails.svelte';
    import Subjects from './Subjects.svelte';
    import Profile from './Profile.svelte';
    import Home from './Home.svelte';
    // @ts-ignore
    import { recordActivity } from '../services/presence.js';
    import MyShelf from './MyShelf.svelte';

    let books: any[] = [];
    let searchQuery = '';
    let isLoading = false;
    let error: string | null = null;

    // Matches on title or author, case-insensitively. Every whitespace-separated
    // term must appear somewhere, so "growth thompson" finds a book by matching
    // one word against the title and the other against the author.
    function matchesSearch(book: any, terms: string[]): boolean {
        const haystack = `${book?.title ?? ''} ${book?.author ?? ''}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
    }

    $: searchTerms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    $: filteredBooks = searchTerms.length === 0
        ? books
        : books.filter((book) => matchesSearch(book, searchTerms));

    function clearSearch() {
        searchQuery = '';
    }



    onMount(() => {
        loadBooks();
        
        // Force shuffle books after they load to ensure random arrangement
        const interval = setInterval(() => {
            if (books.length > 0) {
                // Shuffle all books randomly
                const shuffled = [...books];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                books = shuffled;
                clearInterval(interval);
            }
        }, 100);
        
        recordActivity(true);
    });

    function goToBookDetails(book: any) {
        navigate({
            page: BookDetails,
            props: { book }
        } as any);
    }

    function goToSubjects() {
        navigate({
            page: Subjects,
            props: { books }
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

    function goToProfile() {
        navigate({
            page: Profile
        } as any);
    }

    function goToMyShelf() {
        navigate({
            page: MyShelf
        } as any);
    }

	async function loadBooks() {
		isLoading = true;
		error = null;

		try {
			console.log("Starting to fetch books from Firestore...");
			const snapshot = await firebase()
				.firestore()
				.collection('books')
				.get();

			console.log("Firestore query completed. Found documents:", snapshot.docs.length);

			books = snapshot.docs.map(doc => {
				const data = doc.data();
				
				const title = data.title;
				const author = data.author;
				const detail = data.detail || '';
				const fileUrl = data.fileUrl || null;
				const subjects = data.subjects || null;
				const subject = data.subject || null;
				const yearLevels = data.yearLevels || null;

				const cleanTitle = title.replace(/\s+/g, '').toLowerCase();
				const coverPath = `~/ebooks/cover/${cleanTitle}cover.jpg`;

				return {
					id: doc.id,
					title,
					author,
					detail,
					fileUrl,
					subjects,
					subject,
					yearLevels,
					coverPath,
					fallbackCover: "~/images/bookcoverbrown.jpg"
				};
			});

			console.log("Loaded books count:", books.length);
		} catch (err) {
			console.error("Error loading books:", err);
			error = "Failed to load books. Please try again.";
		} finally {
			isLoading = false;
		}
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

    .header {
        padding: 15 20;
        background-color: #033047;
    }

    .back-btn {
        font-size: 16;
        color: white;
        background-color: transparent;
        border-width: 0;
        padding: 0 10 0 0;
    }

    .header-title {
        font-size: 28;
        font-weight: bold;
        color: white;
        text-align: center;
    }

    .search-container {
        padding: 10 20;
        background-color: white;
        margin-bottom: 10;
    }

    .search-bar {
        font-size: 16;
        padding: 10;
        border-width: 1;
        border-color: #ccc;
        border-radius: 8;
        background-color: #f5f5f5;
    }

    .search-clear {
        font-size: 14;
        color: #033047;
        margin-left: 10;
    }

    .container {
        padding: 0 20;
    }

    .buttons-container {
        margin: 10 0;
    }

    .subjects-btn {
        width: 100%;
        height: 45;
        background-color: #033047;
        color: white;
        border-width: 0;
        border-radius: 8;
        font-size: 16;
        font-weight: bold;
    }

    .recommendation-btn {
        width: 100%;
        height: 45;
        background-color: white;
        color: #033047;
        border-width: 2;
        border-color: #033047;
        border-radius: 8;
        font-size: 16;
        font-weight: bold;
    }

    .books-scroll {
        margin-top: 10;
    }

    .book-item {
        padding: 15;
        margin: 10 0;
        background-color: #f9f9f9;
        border-radius: 8;
        border-width: 1;
        border-color: #e0e0e0;
    }

    .book-info {
        margin-left: 15;
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

    .loading-container,
    .error-container,
    .empty-container {
        padding: 40 20;
        text-align: center;
    }

    .loading-text,
    .error-text,
    .empty-text {
        font-size: 16;
        color: #666;
    }

    .retry-btn {
        margin-top: 20;
        background-color: #033047;
        color: white;
        border-width: 0;
        border-radius: 8;
        padding: 15 30;
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
