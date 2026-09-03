<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, *" columns="*" class="screen">
        <!-- Header with back button -->
        <stackLayout row="0" class="header">
            <gridLayout columns="auto, *" rows="auto">
                <button col="0" text="←" class="back-btn" on:tap={goBack} />
                <label col="1" text="Search Results" class="header-title" />
            </gridLayout>
        </stackLayout>
        <stackLayout row="1" class="divider" />

        <!-- Search Query Display -->
        <stackLayout row="2" class="search-info">
            <label text={`Search: "${searchQuery}"`} class="search-query" />
        </stackLayout>

        <!-- Results List -->
        <scrollView row="3" class="results-scroll">
            <stackLayout class="results-container">
                {#if isLoading}
                    <stackLayout class="loading-container">
                        <label text="Searching..." class="loading-text" />
                    </stackLayout>
                {:else if filteredBooks.length === 0}
                    <stackLayout class="empty-container">
                        <label text="Can't find" class="empty-text" />
                    </stackLayout>
                {:else}
                    <label text={`${filteredBooks.length} book${filteredBooks.length !== 1 ? 's' : ''} found`} class="results-count" />
                    {#each filteredBooks as book (book.id)}
                        <stackLayout class="book-item" on:tap={() => goToBookDetails(book)}>
                            <stackLayout class="book-info">
                                <label text={book.title} class="book-title" />
                                <label text={book.author} class="book-author" />
                            </stackLayout>
                        </stackLayout>
                    {/each}
                {/if}
            </stackLayout>
        </scrollView>
    </gridLayout>
</page>

<script lang="ts">
    import { onMount } from 'svelte';
    import { navigate } from '@nativescript-community/svelte-native';
    import BookDetails from './BookDetails.svelte';
    import MyShelf from './MyShelf.svelte';
    import Profile from './Profile.svelte';
    import Home from './Home.svelte';

    export let searchQuery: string;
    export let books: any[];

    let filteredBooks: any[] = [];
    let isLoading = false;

    function matchesSearch(book: any, terms: string[]): boolean {
        const haystack = `${book?.title ?? ''} ${book?.author ?? ''}`.toLowerCase();
        const matches = terms.every((term) => haystack.includes(term));
        console.log(`Matching "${book.title}" by "${book.author}": haystack="${haystack}", terms=${JSON.stringify(terms)}, matches=${matches}`);
        return matches;
    }

    function performSearch() {
        isLoading = true;
        console.log("=== SEARCH RESULTS DEBUG ===");
        console.log("Search query:", searchQuery);
        console.log("Books received:", books.length);
        console.log("Books titles:", books.map(b => b.title));
        const searchTerms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
        console.log("Search terms:", searchTerms);
        filteredBooks = searchTerms.length === 0
            ? []
            : books.filter((book) => matchesSearch(book, searchTerms));
        console.log("Filtered books count:", filteredBooks.length);
        console.log("Filtered books titles:", filteredBooks.map(b => b.title));
        console.log("===========================");
        isLoading = false;
    }

    onMount(() => {
        performSearch();
    });

    function goBack() {
        navigate({ page: Home });
    }

    function goToBookDetails(book: any) {
        navigate({
            page: BookDetails,
            props: { book }
        } as any);
    }

    function goToLibrary() {
        navigate({ page: Home });
    }

    function goToMyShelf() {
        navigate({ page: MyShelf });
    }

    function goToProfile() {
        navigate({ page: Profile });
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
    }

    .back-btn {
        background-color: transparent;
        color: #033047;
        font-size: 24;
        font-weight: bold;
        border-width: 0;
        padding: 0 10 0 0;
        margin: 0;
    }

    .header-title {
        font-size: 18;
        font-weight: bold;
        font-family: Archivo, sans-serif;
        color: #201e1d;
        vertical-align: center;
        margin-left: 10;
    }

    .divider {
        height: 2;
        background-color: #201e1d;
        margin: 0 20;
    }

    .search-info {
        padding: 20 20 10 20;
        background-color: white;
        border-bottom-width: 1;
        border-bottom-color: #eee;
    }

    .search-query {
        font-size: 16;
        font-weight: bold;
        color: #033047;
        margin-bottom: 5;
    }

    .search-count {
        font-size: 14;
        color: #666;
    }

    .results-count {
        font-size: 14;
        font-weight: bold;
        color: #033047;
        margin: 10 0 15 0;
        padding: 0 20;
    }

    .results-scroll {
        padding: 10 20;
        height: 100%;
    }

    .results-container {
        padding-bottom: 20;
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

    .book-info {
        padding: 10 0;
    }

    .book-title {
        font-size: 18;
        font-weight: bold;
        color: #033047;
        margin-bottom: 5;
        font-family: Archivo, sans-serif;
        text-transform: capitalize;
    }

    .book-author {
        font-size: 14;
        color: #666;
    }

    .loading-container,
    .empty-container {
        padding: 40 20;
        text-align: center;
    }

    .loading-text,
    .empty-text {
        font-size: 16;
        color: #666;
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
</style>
