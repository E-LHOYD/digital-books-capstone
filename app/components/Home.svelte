<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, auto, *, auto" columns="*" class="screen">
        <!-- Header: logo + wordmark -->
        <stackLayout row="0" orientation="horizontal" class="header">
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
        <stackLayout row={3} col={0} class="container">
            <stackLayout orientation="horizontal" class="buttons-container">
                <button text="Subjects" class="subjects-btn" on:tap={goToSubjects} />
                <button text="Browse more" class="recommendation-btn" on:tap={goToBrowseAll} />
            </stackLayout>

            <!-- Books List - Expanded -->
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
        <stackLayout row={4} col={0} class="bottom-container-fixed">
            <stackLayout orientation="horizontal" class="bottom-buttons">
                <stackLayout class="nav-btn" class:nav-btn-active={currentPage === 'library'} on:tap={() => currentPage = 'library'}>
                    <label text="📚" class="nav-icon" />
                    <label text="Library" class="nav-text" />
                </stackLayout>
                <stackLayout class="nav-btn" class:nav-btn-active={currentPage === 'my-shelf'} on:tap={goToMyShelf}>
                    <label text="📖" class="nav-icon" />
                    <label text="My Shelf" class="nav-text" />
                </stackLayout>
                <stackLayout class="nav-btn" class:nav-btn-active={currentPage === 'profile'} on:tap={goToProfile}>
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
    import Recommendations from './Recommendations.svelte';
    import Subjects from './Subjects.svelte';
    import Profile from './Profile.svelte';
    import BrowseAll from './BrowseAll.svelte';
    // @ts-ignore
    import { recordActivity } from '../services/presence.js';
    import MyShelf from './MyShelf.svelte';
    // @ts-ignore
    import { recommendBooks, recommendationReason } from '../services/recommendations.js';
    // @ts-ignore
    import { getCurrentUser, getUserProfile } from '../services/firebase';

    let books: any[] = [];
    let displayedBooks: any[] = [];
    let searchQuery = '';
    let currentPage = 'library'; // 'home', 'library', 'my-shelf', 'profile'
    let isLoading = false;
    let error: string | null = null;
    let currentUser: any = null;

    // Matches on title or author, case-insensitively. Every whitespace-separated
    // term must appear somewhere, so "growth thompson" finds a book by matching
    // one word against the title and the other against the author.
    function matchesSearch(book: any, terms: string[]): boolean {
        const haystack = `${book?.title ?? ''} ${book?.author ?? ''}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
    }

    $: searchTerms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    $: filteredBooks = searchTerms.length === 0
        ? displayedBooks
        : books.filter((book) => matchesSearch(book, searchTerms));



    function clearSearch() {
        searchQuery = '';
    }



    onMount(() => {
        // Load current user and their profile
        getCurrentUser().then(async (authUser) => {
            if (authUser) {
                // Fetch the full user profile from Firestore
                const userProfile = await getUserProfile(authUser.uid);
                // Merge auth user with profile data
                currentUser = { ...authUser, ...userProfile };
            }
        });

        // Load books
        loadBooks();

        // Force refresh displayedBooks after books load to ensure random shuffle
        const interval = setInterval(() => {
            if (books.length > 0) {
                if (currentUser) {
                    displayedBooks = recommendBooks(books, currentUser, Number.MAX_SAFE_INTEGER);
                } else {
                    // Shuffle all books randomly for non-logged-in users
                    const shuffled = [...books];
                    for (let i = shuffled.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                    }
                    displayedBooks = shuffled;
                }
                clearInterval(interval);
            }
        }, 100);

        // Marks the user active whenever the library is opened, which is what
        // the dashboard counts.
        recordActivity(true);
    });

    function goToBookDetails(book: any) {
        navigate({
            page: BookDetails,
            props: { book }
        } as any);
    }

    function goToSubjects() {
        // The library already has every book, so the subject pages work from
        // that rather than reading Firestore again.
        navigate({
            page: Subjects,
            props: { books }
        } as any);
    }

    function goToRecommendations() {
        navigate({
            page: Recommendations
        } as any);
    }

    function goToBrowseAll() {
        navigate({
            page: BrowseAll
        } as any);
    }

    function goToProfile() {
        currentPage = 'profile';
        navigate({
            page: Profile
        } as any);
    }

    function goToMyShelf() {
        currentPage = 'my-shelf';
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
			console.log("All document IDs:", snapshot.docs.map(doc => doc.id));

			books = snapshot.docs.map(doc => {
				const data = doc.data();
				console.log("Document data for", doc.id, ":", data);

				const title = data.title;
				const author = data.author;
				const detail = data.detail || '';
				const fileUrl = data.fileUrl || null;
				// Kept as written so bookSubjects can read either the list or the
				// older single string.
				const subjects = data.subjects || null;
				const subject = data.subject || null;
				// Carried through so recommendations and details see the same fields.
				const yearLevels = data.yearLevels || null;

				// Generate proper NativeScript image paths with lowercase for Android compatibility
				const cleanTitle = title.replace(/\s+/g, '').toLowerCase();
				const coverPath = `~/ebooks/cover/${cleanTitle}cover.jpg`;

				console.log("Book title:", title);
				console.log("Book author:", author);
				console.log("Book detail:", detail);
				console.log("Book file URL:", fileUrl);
				console.log("Generated cover path:", coverPath);
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
					fallbackCover: "~/images/bookcoverbrown.jpg" // fallback image
				};
			});

			console.log("Final books array:", books);
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

    .book-info {
        padding: 10 0;
    }

    .books-scroll {
        height: 538;
        border-width: 1;
        border-color: #eee;
        border-radius: 8;
        margin: 10 0;
        width: 100%;
    }

    .book-item {
        padding: 20;
        border-bottom-width: 1;
        border-bottom-color: #f0f0f0;
        margin: 5 0;
        background-color: white;
        border-radius: 8;
        box-shadow: 0 1 3px rgba(0,0,0,0.1);
    }

    .book-item:active {
        background-color: #f8f8f8;
        opacity: 0.8;
    }

    .book-title {
        font-size: 18;
        font-weight: bold;
        color: #033047;
        margin-bottom: 5;
        font-family: Archivo, sans-serif;
    }

    .book-author {
        font-size: 14;
        color: #666;
    }

    .loading-container,
    .error-container,
    .empty-container {
        padding: 20;
        text-align: center;
    }

    .loading-text,
    .error-text,
    .empty-text {
        font-size: 16;
        color: #666;
    }

    .retry-btn {
        margin-top: 10;
        padding: 10 20;
        background-color: #033047;
        color: white;
        border-radius: 8;
        font-size: 14;
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
