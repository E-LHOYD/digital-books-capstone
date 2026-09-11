<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, *, auto" columns="*" class="screen">
        <AppHeader row={0} back on:back={goBack} />

        <!-- Results, as book cards like the Library's -->
        <scrollView row={2} col={0}>
            <stackLayout class="container">
                <label text="Search results" class="page-title" />
                <label text={`For "${searchQuery}"`} class="muted-text" textWrap="true" />
                {#if isLoading}
                    <stackLayout class="loading-container">
                        <label text="Searching..." class="loading-text" />
                    </stackLayout>
                {:else if filteredBooks.length === 0}
                    <stackLayout class="empty-container">
                        <label text="No books match that search." class="empty-text" textWrap="true" />
                    </stackLayout>
                {:else}
                    <label text={`${filteredBooks.length} book${filteredBooks.length !== 1 ? 's' : ''} found`} class="count-text" />
                    {#each filteredBooks as book (book.id)}
                        <stackLayout class="book-item" on:tap={() => goToBookDetails(book)}>
                            <stackLayout class="book-info">
                                <label text={book.title} class="book-title" textWrap="true" />
                                <label text={book.author} class="book-author" />
                            </stackLayout>
                        </stackLayout>
                    {/each}
                {/if}
            </stackLayout>
        </scrollView>

        <BottomNav row={3} active="library" />
    </gridLayout>
</page>

<script lang="ts">
    import { onMount } from 'svelte';
    import { navigate } from '@nativescript-community/svelte-native';
    import BookDetails from './BookDetails.svelte';
    import Home from './Home.svelte';
    import AppHeader from './AppHeader.svelte';
    import BottomNav from './BottomNav.svelte';

    export let searchQuery: string;
    export let books: any[];

    let filteredBooks: any[] = [];
    let isLoading = false;

    function matchesSearch(book: any, terms: string[]): boolean {
        // Book number included, so "0042" finds the book numbered BK-0042.
        const haystack = `${book?.bookNumber ?? ''} ${book?.title ?? ''} ${book?.author ?? ''}`.toLowerCase();
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
</script>

