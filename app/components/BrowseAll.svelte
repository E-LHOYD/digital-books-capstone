<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, auto, *, auto" columns="*" class="screen">
        <AppHeader row={0} back on:back={goBack} />

        <!-- Search Bar -->
        <stackLayout row={2} col={0} class="search-container">
            <gridLayout rows="auto" columns="*, auto, auto">
                <textField
                    row={0}
                    col={0}
                    hint="Search title, author or book number"
                    class="search-bar"
                    text={searchQuery}
                    on:textChange={handleSearchTextChange}
                />
                <!--
                    Both buttons stay mounted and are collapsed when the field is
                    empty, rather than being added and removed by an {#if}.
                    Inserting children into a GridLayout after it has laid out is
                    the same operation that throws "View already has a parent",
                    and collapse takes no space, so the field still spans the row.
                -->
                <button
                    row={0}
                    col={1}
                    text="Clear"
                    class="search-clear"
                    visibility={searchQuery ? 'visible' : 'collapse'}
                    on:tap={clearSearch}
                />
                <button
                    row={0}
                    col={2}
                    text="Search"
                    class="search-btn"
                    visibility={searchQuery ? 'visible' : 'collapse'}
                    on:tap={performSearch}
                />
            </gridLayout>
        </stackLayout>

        <!-- Main Content: the list takes whatever height is left -->
        <gridLayout row={3} col={0} rows="auto, *" class="container">
            <stackLayout row={0} orientation="horizontal" class="pill-row">
                <button text="Subjects" class="pill" on:tap={goToSubjects} />
            </stackLayout>

            <!-- Books List -->
            <scrollView row={1}>
                <stackLayout>
                    <label text="All books" class="section-title" />
                    {#if isLoading}
                        <stackLayout class="loading-container">
                            <label text="Loading books..." class="loading-text" />
                        </stackLayout>
                    {:else if error}
                        <stackLayout class="error-container">
                            <label text={error} class="error-text" />
                            <button text="Retry" class="btn btn-primary" on:tap={loadBooks} />
                        </stackLayout>
                    {:else if books.length === 0}
                        <stackLayout class="empty-container">
                            <label text="No books found" class="empty-text" />
                        </stackLayout>
                    {:else}
                        {#each books as book}
							<stackLayout class="book-item" on:tap={() => goToBookDetails(book)}>
								
								<!-- Book Info -->
								<stackLayout class="book-info">
									<label text={book.title} class="book-title" textWrap="true" />
									<label text={book.author} class="book-author" />
								</stackLayout>

							</stackLayout>
						{/each}
                    {/if}
                </stackLayout>
            </scrollView>
        </gridLayout>

        <BottomNav row={4} active="library" />
    </gridLayout>
</page>

<script lang="ts">
    import AppHeader from './AppHeader.svelte';
    import BottomNav from './BottomNav.svelte';
    import { onMount } from 'svelte';
    import { firebase } from '@nativescript/firebase-core';
	import '@nativescript/firebase-firestore';
    import { navigate } from '@nativescript-community/svelte-native';
    import BookDetails from './BookDetails.svelte';
    import Subjects from './Subjects.svelte';
    import Home from './Home.svelte';
    import SearchResults from './SearchResults.svelte';
    // @ts-ignore
    import { recordActivity } from '../services/presence.js';

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

    function handleSearchTextChange(e: any) {
        searchQuery = e?.value ?? e?.object?.text ?? '';
        console.log("Search query changed:", searchQuery);
    }



    onMount(() => {
        // Shuffled once, as soon as the books are in. This used to be a
        // setInterval polling every 100ms for books.length > 0, which fired at
        // an arbitrary moment and reassigned books -- including while the user
        // was typing or tapping. Combined with the keyed each above, that threw
        // "View already has a parent" during Svelte's flush, and an exception
        // there leaves the scheduler wedged: the book list had already drawn,
        // but nothing reactive updated afterwards. That is why the Clear and
        // Search buttons never appeared on this page while they worked on Home.
        loadBooks().finally(() => {
            const shuffled = [...books];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            books = shuffled;
        });

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
					// Searched on alongside title and author.
					bookNumber: data.bookNumber != null ? String(data.bookNumber) : '',
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
					// The cover uploaded from the dashboard, when the book has one.
					coverUrl: data.coverUrl || null,
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
