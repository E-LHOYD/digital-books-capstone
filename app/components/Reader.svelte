<page actionBarHidden={true} class="reader-page">
    <gridLayout rows="auto, *" columns="*">

        <!-- Top bar -->
        <gridLayout row={0} col={0} rows="auto" columns="auto, *" class="reader-bar">
            <button row={0} col={0} text="Back" class="reader-back" on:tap={goBack} />
            <label row={0} col={1} text={book.title} class="reader-title" textWrap="false" />
        </gridLayout>

        <!-- Book -->
        <gridLayout row={1} col={0} rows="*" columns="*">
            <webView
                row={0}
                col={0}
                src={readerUrl}
                on:loadStarted={onLoadStarted}
                on:loadFinished={onLoadFinished}
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

    export let book: any;

    // Cache-busting counter: bumping it changes `src`, which forces the
    // WebView to reload after a failure.
    let attempt = 0;
    let isLoading = true;
    let loadError: string | null = null;

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
        }
    }

    function retry() {
        loadError = null;
        isLoading = true;
        attempt += 1;
    }

    function goBack() {
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
