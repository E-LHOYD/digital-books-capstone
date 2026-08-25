<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, auto, *, auto" columns="*" class="screen">
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

        <!-- Search Bar -->
        <stackLayout row={2} col={0} class="search-container">
            <gridLayout rows="auto" columns="*, auto, auto">
                <textField
                    row={0}
                    col={0}
                    hint="Search title or author"
                    class="search-bar"
                    text={searchQuery}
                    on:textChange={(e) => {
                        searchQuery = e?.value ?? e?.object?.text ?? '';
                        console.log("Search query changed:", searchQuery);
                    }}
                />
                {#if searchQuery}
                    <button row={0} col={1} text="Clear" class="search-clear" on:tap={clearSearch} />
                {/if}
                <button row={0} col={2} text="Search" class="search-btn" on:tap={performSearch} />
            </gridLayout>
        </stackLayout>

        <!-- Main Content -->
        <stackLayout row={3} col={0} class="container">
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
                    {:else}
                        {#each books as book (book.id)}
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
        <stackLayout row={4} col={0} class="bottom-container-fixed">
            <stackLayout orientation="horizontal" class="bottom-buttons">
                <stackLayout class="nav-btn nav-btn-active" on:tap={goToLibrary}>
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
    import { firebase } from '@nativescript/firebase-core';
	import '@nativescript/firebase-firestore';
    import { navigate } from '@nativescript-community/svelte-native';
    import BookDetails from './BookDetails.svelte';
    import Subjects from './Subjects.svelte';
    import Profile from './Profile.svelte';
    import Home from './Home.svelte';
    import SearchResults from './SearchResults.svelte';
    // @ts-ignore
    import { recordActivity } from '../services/presence.js';
    import MyShelf from './MyShelf.svelte';

    let books: any[] = [];
    let searchQuery = '';
    let isLoading = false;
    let error: string | null = null;

    $: console.log("Reactive: searchQuery =", searchQuery);

    function clearSearch() {
        searchQuery = '';
    }

    function performSearch() {
        console.log("=== BROWSE ALL SEARCH DEBUG ===");
        console.log("Search query:", searchQuery.trim());
        console.log("Books being passed:", books.length);
        console.log("Books titles:", books.map(b => b.title));
        console.log("===============================");
        if (searchQuery.trim()) {
            navigate({
                page: SearchResults,
                props: { searchQuery: searchQuery.trim(), books }
            } as any);
        }
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
					publishedDate: data.publishedDate || null,
					releaseDate: data.releaseDate || null,
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

    .search-container {
        padding: 20 20 0 20;
    }

    .search-bar {
        border-width: 2;
        border-color: #201e1d;
        border-radius: 0;
        background-color: #ffffff;
        font-size: 16;
        padding: 10;
        height: 48;
        margin: 0 0 16 0;
        color: #201e1d;
    }

    .search-clear {
        background-color: transparent;
        color: #033047;
        font-size: 14;
        font-weight: bold;
        border-width: 0;
        padding: 0 12;
        margin: 0;
        vertical-align: center;
    }

    .search-btn {
        background-color: #033047;
        color: white;
        font-size: 14;
        font-weight: bold;
        border-width: 0;
        padding: 0 15;
        margin: 0 0 0 10;
        border-radius: 0;
        vertical-align: center;
    }

    .container {
        padding: 0 20;
    }

    .buttons-container {
        margin: 15 0;
        width: 100%;
        text-align: center;
    }

    .subjects-btn {
        width: 150;
        margin: 10;
        padding: 10;
        border-radius: 100;
        font-size: 16;
        font-weight: bold;
        background-color: white;
        color: #033047;
        border-width: 4;
        border-color: #033047;
    }

    .recommendation-btn {
        width: 150;
        margin: 10;
        padding: 10;
        border-radius: 100;
        font-size: 16;
        font-weight: bold;
        background-color: white;
        color: #033047;
        border-width: 4;
        border-color: #033047;
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
