<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, *, auto" columns="*" class="main-layout">
        <!-- Search Bar at Top -->
        <stackLayout row={0} col={0} class="search-container">
            <textField hint="Search..." class="search-bar" />
        </stackLayout>
        
        <!-- Main Content -->
        <stackLayout row={1} col={0} class="container">
            <stackLayout orientation="horizontal" class="buttons-container">
                <button text="Subjects" class="subjects-btn" />
                <button text="Recommendation" class="recommendation-btn" on:tap={goToRecommendations} />
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
                    {:else}
                        {#each books as book (book)}
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
        <stackLayout row={2} col={0} class="bottom-container-fixed">
            <stackLayout orientation="horizontal" class="bottom-buttons">
                <button text="Library" class="nav-btn" class:nav-btn-active={currentPage === 'library'} />
                <button text="My Shelf" class="nav-btn" class:nav-btn-active={currentPage === 'my-shelf'} />
                <button text="Settings" class="nav-btn" class:nav-btn-active={currentPage === 'settings'} />
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

    let books: any[] = [];
    let currentPage = 'library'; // 'home', 'library', 'my-shelf', 'settings'
    let isLoading = false;
    let error: string | null = null;

    onMount(() => {
        loadBooks();
    });

    function goToBookDetails(book: any) {
        navigate({
            page: BookDetails,
            props: { book }
        } as any);
    }

    function goToRecommendations() {
        navigate({
            page: Recommendations
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

				// Generate proper NativeScript image paths with lowercase for Android compatibility
				const cleanTitle = title.replace(/\s+/g, '').toLowerCase();
				const coverPath = `~/ebooks/cover/${cleanTitle}cover.jpg`;
				const bookPath = `~/ebooks/books/${cleanTitle}.pdf`;

				console.log("Book title:", title);
				console.log("Book author:", author);
				console.log("Book detail:", detail);
				console.log("Generated cover path:", coverPath);
                console.log("Generated book path:", bookPath);
				return {
					id: doc.id,
					title,
					author,
					detail,
					coverPath,
					bookPath,
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
		background-color: #f5f5f5;
    }

    .main-layout {
        width: 100%;
        height: 100%;
    }

    .search-container {
        padding: 10 20;
        background-color: #f5f5f5;
    }

    .container {
        padding: 0 20;
    }

    .bottom-container-fixed {
        padding: 10 5;
        vertical-align: bottom;
        background-color: #f5f5f5;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
    }

    .bottom-buttons {
        width: 100%;
        border-width:4;
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

    .search-bar {
        border-width: 2;
        border-color: #ccc;
        border-radius: 8;
        font-size: 16;
        padding: 10;
        height: 45;
        width: 100%;
        background-color: white;
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
        font-family: Milonga-Regular;
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
        vertical-align: center;
    }

    .loading-text,
    .empty-text {
        font-size: 16;
        color: #666;
        text-align: center;
    }

    .error-text {
        font-size: 16;
        color: #d32f2f;
        text-align: center;
        margin-bottom: 10;
    }

    .retry-btn {
        background-color: #033047;
        color: white;
        font-size: 14;
        padding: 10 20;
        border-radius: 6;
        border-width: 0;
    }
</style>

