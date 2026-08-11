<page actionBarHidden={true} class="reader-page">
    <gridLayout rows="auto, auto, *" columns="*">

        <!-- Top bar -->
        <gridLayout row={0} col={0} rows="auto" columns="auto, *, auto" class="reader-bar">
            <button row={0} col={0} text="Back" class="reader-back" on:tap={goBack} />
            <label row={0} col={1} text={book.title} class="reader-title" textWrap="false" />
            <label row={0} col={2} text={`${currentPage} / ${totalPages}`} class="reader-page-counter" />
        </gridLayout>

        <!-- Progress bar -->
        <gridLayout row={1} col={0} rows="auto" columns="*" class="reader-progress-container">
            <progress row={0} col={0} value={progressPercentage} maxValue="100" class="reader-progress-bar" />
            <label row={0} col={0} text={`${progressPercentage.toFixed(1)}%`} class="reader-progress-text" />
        </gridLayout>

        <!-- Book -->
        <gridLayout row={2} col={0} rows="*" columns="*">
            <webView
                bind:this={webViewRef}
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
    import { Frame, isAndroid } from '@nativescript/core';
    import { onDestroy } from 'svelte';
    import { getReaderUrl } from '../services/storage.js';
    // @ts-ignore
    import { recordActivity } from '../services/presence.js';
    // @ts-ignore
    import { saveReadingProgress, getReadingProgress } from '../services/readingProgress.js';

    export let book: any;

    // Cache-busting counter: bumping it changes `src`, which forces the
    // WebView to reload after a failure.
    let attempt = 0;
    let isLoading = true;
    let loadError: string | null = null;
    
    // Reading progress tracking
    let webViewRef: any = null;
    let currentPage = 1;
    let totalPages = 0;
    let progressPercentage = 0;
    let furthestPage = 1;
    let saveTimer: any = null;
    let pollTimer: any = null;

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
            startPolling();
        }
    }

    async function loadExistingProgress() {
        try {
            const progress = await getReadingProgress(book.id);
            if (progress) {
                furthestPage = progress.currentPage || 1;
                currentPage = furthestPage;
                totalPages = progress.totalPages || 0;
                progressPercentage = progress.percentage || 0;
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }

    function updateProgress(newPage: number, newTotal: number) {
        if (!newTotal) return;

        totalPages = newTotal;
        currentPage = newPage;

        // Progress is the furthest point reached, so scrolling back up does not
        // undo it.
        if (newPage > furthestPage) furthestPage = newPage;
        progressPercentage = (furthestPage / totalPages) * 100;

        // Debounced save to Firestore
        if (saveTimer) {
            clearTimeout(saveTimer);
        }

        saveTimer = setTimeout(() => {
            saveReadingProgress(book.id, furthestPage, totalPages, progressPercentage);
        }, 2000); // Save after 2 seconds of inactivity
    }

    // The PDF is rendered by a web page inside the WebView, so scrolling is
    // invisible to the app. The page keeps window.__readerProgress current and
    // this polls it.
    //
    // Polled rather than pushed: addJavascriptInterface needs methods annotated
    // with @JavascriptInterface on API 17+, and the NativeScript runtime cannot
    // emit Java annotations on classes extended from JavaScript. Implementing
    // ValueCallback is plain interface implementation, which it can do.
    let loggedFirstPayload = false;
    let loggedNoBridge = false;

    // bind:this yields svelte-native's element wrapper, not the NativeScript
    // view, so the native handle lives one level down. NativeViewElementNode
    // exposes it as nativeView; NativeElementNode as nativeElement.
    function resolveWebView(): any {
        if (!webViewRef) return null;
        return webViewRef.nativeView ?? webViewRef.nativeElement ?? webViewRef;
    }

    function readProgressFromPage() {
        const view = resolveWebView();
        const native = view?.android;
        if (!isAndroid || !native || typeof native.evaluateJavascript !== 'function') {
            if (!loggedNoBridge) {
                loggedNoBridge = true;
                console.error(
                    'Reader progress unavailable: isAndroid=' + isAndroid +
                    ' webViewRef=' + !!webViewRef +
                    ' view=' + !!view +
                    ' android=' + !!native
                );
            }
            return;
        }

        try {
            native.evaluateJavascript(
                'JSON.stringify(window.__readerProgress || null)',
                new android.webkit.ValueCallback({
                    onReceiveValue(value: any) {
                        try {
                            if (!loggedFirstPayload) {
                                loggedFirstPayload = true;
                                // If this logs "null", the reader page being served
                                // does not publish progress yet - deploy the dashboard.
                                console.log('Reader progress payload:', String(value));
                            }
                            if (!value || value === 'null') return;
                            // evaluateJavascript hands back a JSON string literal,
                            // so the payload needs unwrapping twice.
                            let raw = String(value);
                            const once = JSON.parse(raw);
                            const data = typeof once === 'string' ? JSON.parse(once) : once;
                            if (data && data.total) {
                                updateProgress(Number(data.page) || 1, Number(data.total));
                            }
                        } catch (e) {
                            console.error('Reader progress parse failed:', e);
                        }
                    }
                })
            );
        } catch (error) {
            console.error('Reader progress poll failed:', error);
        }
    }

    function startPolling() {
        stopPolling();
        readProgressFromPage();
        pollTimer = setInterval(() => {
            readProgressFromPage();
            // Throttled inside recordActivity, so this is one write every couple
            // of minutes, not one a second. Without it a reader settled into a
            // long book stops counting as active.
            recordActivity();
        }, 1000);
    }

    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    onDestroy(() => {
        stopPolling();
        if (saveTimer) clearTimeout(saveTimer);
    });

    function retry() {
        loadError = null;
        isLoading = true;
        attempt += 1;
    }

    function goBack() {
        stopPolling();
        if (saveTimer) clearTimeout(saveTimer);

        // Save progress before leaving
        if (totalPages > 0) {
            saveReadingProgress(book.id, furthestPage, totalPages, progressPercentage);
        }
        
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
