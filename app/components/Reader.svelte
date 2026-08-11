<page actionBarHidden={true} class="reader-page">
    <gridLayout rows="auto, auto, *" columns="*">

        <!-- Top bar -->
        <gridLayout row={0} col={0} rows="auto" columns="auto, *, auto" class="reader-bar">
            <button row={0} col={0} text="Back" class="reader-back" on:tap={goBack} />
            <label row={0} col={1} text={book.title} class="reader-title" textWrap="false" />
            <label row={0} col={2} text={`Page ${currentPage}`} class="reader-page-counter" />
        </gridLayout>

        <!-- Progress bar -->
        <gridLayout row={1} col={0} rows="auto" columns="*" class="reader-progress-container">
            <progress row={0} col={0} value={progressPercentage} maxValue="100" class="reader-progress-bar" />
            <label row={0} col={0} text={`${progressPercentage.toFixed(1)}%`} class="reader-progress-text" />
        </gridLayout>

        <!-- Book -->
        <gridLayout row={2} col={0} rows="*" columns="*">
            <webView
                row={0}
                col={0}
                src={readerUrl}
                on:loadStarted={onLoadStarted}
                on:loadFinished={onLoadFinished}
                bind:this={webView}
            />

            {#if isLoading}
                <stackLayout row={0} col={0} class="reader-overlay" verticalAlignment="center">
                    <activityIndicator busy={true} />
                    <label text="Opening book..." class="reader-overlay-text" />
                </stackLayout>
            {/if}

            {#if loadError}
                <stackLayout row={0} col={0} class="reader-overlay" verticalAlignment="center">
                    <label text={loadError} class="reader-error-text" textWrap="true" />
                    <button text="Try again" class="reader-retry" on:tap={retry} />
                </stackLayout>
            {/if}
        </gridLayout>

    </gridLayout>
</page>

<script lang="ts">
    import { Frame } from '@nativescript/core';
    import { getReaderUrl } from '../services/storage.js';
    // @ts-ignore
    import { saveReadingProgress, getReadingProgress } from '../services/readingProgress.js';

    export let book: any;

    // Cache-busting counter: bumping it changes `src`, which forces the
    // WebView to reload after a failure.
    let attempt = 0;
    let isLoading = true;
    let loadError: string | null = null;
    
    // Reading progress tracking
    let currentPage = 1;
    let totalPages = 100; // Default, will be updated from actual PDF
    let progressPercentage = 0;
    let saveTimer: any = null;
    let webView: any = null;

    $: readerUrl = `${getReaderUrl(book.fileUrl)}${attempt ? `&retry=${attempt}` : ''}`;

    function onLoadStarted() {
        isLoading = true;
        loadError = null;
    }

    function onLoadFinished(args: any) {
        isLoading = false;

        if (args && args.error) {
            console.error('Reader WebView error:', args.error);
            loadError =
                'Could not open this book. Check your internet connection and try again.';
        } else {
            // Load existing progress
            loadExistingProgress();
            // Try to get page count from PDF
            getPageCount();
        }
    }

    async function loadExistingProgress() {
        try {
            const progress = await getReadingProgress(book.id);
            if (progress) {
                currentPage = progress.currentPage || 1;
                totalPages = progress.totalPages || 100;
                progressPercentage = progress.percentage || 0;
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }

    function getPageCount() {
        // Send message to WebView to get page count
        // This would require the reader page to expose an API
        // For now, we'll use a default and estimate
        console.log('Getting page count from PDF...');
    }

    function updateProgress(newPage: number) {
        currentPage = newPage;
        progressPercentage = (currentPage / totalPages) * 100;
        
        // Debounced save to Firestore
        if (saveTimer) {
            clearTimeout(saveTimer);
        }
        
        saveTimer = setTimeout(() => {
            saveReadingProgress(book.id, currentPage, totalPages, progressPercentage);
        }, 2000); // Save after 2 seconds of inactivity
    }

    function retry() {
        loadError = null;
        isLoading = true;
        attempt += 1;
    }

    function goBack() {
        // Save progress before leaving
        saveReadingProgress(book.id, currentPage, totalPages, progressPercentage);
        
        // Pop back to the book details page rather than pushing a new copy of
        // it onto the navigation stack.
        Frame.topmost()?.goBack();
    }
</script>

<style>
    .reader-page {
        background-color: #33383d;
    }

    .reader-bar {
        background-color: #033047;
        padding: 8 10;
    }

    .reader-back {
        background-color: transparent;
        color: white;
        font-size: 16;
        font-weight: bold;
        border-width: 0;
        padding: 6 12;
        margin: 0;
    }

    .reader-title {
        color: white;
        font-size: 16;
        vertical-align: center;
        margin-left: 6;
    }

    .reader-page-counter {
        color: white;
        font-size: 14;
        vertical-align: center;
        margin-right: 10;
    }

    .reader-progress-container {
        background-color: #033047;
        padding: 4 10;
    }

    .reader-progress-bar {
        height: 4;
        value: 0;
    }

    .reader-progress-text {
        color: white;
        font-size: 12;
        horizontal-align: right;
        margin-right: 10;
    }

    .reader-overlay {
        background-color: #33383d;
        padding: 30;
        horizontal-align: center;
        vertical-align: center;
    }

    .reader-overlay-text {
        color: #e8e8e8;
        font-size: 16;
        text-align: center;
        margin-top: 12;
    }

    .reader-error-text {
        color: #ffb4b4;
        font-size: 16;
        text-align: center;
        margin-bottom: 16;
    }

    .reader-retry {
        background-color: #ffffff;
        color: #033047;
        font-size: 16;
        font-weight: bold;
        border-radius: 8;
        border-width: 0;
        padding: 12 24;
        horizontal-align: center;
    }
</style>
