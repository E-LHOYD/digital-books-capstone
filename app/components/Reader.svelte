<page actionBarHidden={true} class="reader-page">
    <gridLayout rows="auto, auto, auto, *" columns="*">

        <!-- Top bar: Back and the whole title (wrapping onto more lines when it
             is long), then the page counter and the bookmark buttons below. -->
        <gridLayout row={0} col={0} rows="auto, auto" columns="auto, *" class="reader-bar">
            <button row={0} col={0} text="←  Back" class="reader-back" verticalAlignment="top" on:tap={goBack} />
            <label row={0} col={1} text={book.title} class="reader-title" textWrap="true" />

            <gridLayout rows="auto" row={1} col={0} colSpan={2} columns="*, auto, auto" class="reader-tools">
                <label col={0} text={`Page ${currentPage} of ${totalPages}`} class="reader-page-counter" />
                <!-- Bookmarks the page on screen; on a page already bookmarked, removes it. -->
                <button
                    col={1}
                    text={currentMarked ? '🔖 Bookmarked' : '📑 Bookmark'}
                    class="reader-bookmark"
                    class:highlighted={currentMarked}
                    isEnabled={!bookmarkBusy}
                    on:tap={toggleBookmark}
                />
                <!-- Opens the list of bookmarked pages. -->
                <button
                    col={2}
                    text={'☰ Bookmarks (' + bookmarks.length + ')'}
                    class="reader-bookmark-list"
                    on:tap={() => (showBookmarks = !showBookmarks)}
                />
            </gridLayout>
        </gridLayout>

        <!--
            Bookmarked pages, opened from the ☰ button. Tap a page to go to it,
            ✕ to remove it. Always mounted and collapsed rather than added with
            an {#if}, since it sits in the page's GridLayout.
        -->
        <stackLayout row={1} col={0} class="bookmark-panel" visibility={showBookmarks ? 'visible' : 'collapse'}>
            <label
                text={bookmarks.length
                    ? 'Bookmarks · tap a page to go there'
                    : 'No bookmarks yet. Tap 📑 Bookmark to bookmark the page you are on.'}
                class="bookmark-panel-title"
                textWrap="true"
            />
            <label
                text={bookmarkError}
                class="bookmark-error"
                textWrap="true"
                visibility={bookmarkError ? 'visible' : 'collapse'}
            />
            <scrollView
                height={Math.min(bookmarks.length, 4) * 48}
                visibility={bookmarks.length ? 'visible' : 'collapse'}
            >
                <stackLayout>
                    {#each bookmarks as number (number)}
                        <gridLayout rows="auto"
                            columns="*, auto"
                            class="bookmark-row"
                            class:bookmark-row-here={number === currentPage}
                            on:tap={() => goToPage(number)}
                        >
                            <label col={0} text={'Page ' + number} class="bookmark-page" />
                            <button col={1} text="✕" class="bookmark-remove" on:tap={() => deleteBookmark(number)} />
                        </gridLayout>
                    {/each}
                </stackLayout>
            </scrollView>
        </stackLayout>

        <!-- Progress bar -->
        <gridLayout row={2} col={0} rows="auto" columns="*" class="reader-progress-container">
            <progress row={0} col={0} value={progressPercentage} maxValue="100" class="reader-progress-bar" />
            <label row={0} col={0} text={`${progressPercentage.toFixed(1)}%`} class="reader-progress-text" />
        </gridLayout>

        <!-- Book -->
        <gridLayout row={3} col={0} rows="*" columns="*">
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
    import { Frame, isAndroid, Application } from '@nativescript/core';
    import { onDestroy, onMount } from 'svelte';
    import { getReaderUrl } from '../services/storage.js';
    // @ts-ignore
    import { recordActivity } from '../services/presence.js';
    // @ts-ignore
    import { saveReadingProgress, getReadingProgress, bookmarksOf, addBookmark, removeBookmark, startReadingSession, endReadingSession } from '../services/readingProgress.js';

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
    // Every bookmarked page, lowest first. Shared with the web reader.
    let bookmarks: number[] = [];
    let showBookmarks = false;
    let bookmarkBusy = false;
    let bookmarkError = '';

    $: currentMarked = bookmarks.includes(currentPage);
    let jumpPage = 0;

    $: readerUrl = getReaderUrl(book.fileUrl, jumpPage > 1 ? { page: jumpPage } : {}) + (attempt ? `&retry=${attempt}` : '');

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
            // Start reading session for duration tracking
            startReadingSession(book.id);
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
            
            // Bookmarks live on the same document as the progress.
            bookmarks = bookmarksOf(progress);
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
        // Remove screenshot prevention when leaving reader
        if (isAndroid) {
            try {
                const activity = Application.android.foregroundActivity;
                if (activity) {
                    activity.getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);
                }
            } catch (error) {
                console.error('Error removing screenshot prevention:', error);
            }
        }
    });

    onMount(() => {
        // Prevent screenshots and screen recording on Android
        if (isAndroid) {
            try {
                // Method 1: Set on activity window
                const activity = Application.android.foregroundActivity;
                if (activity && activity.getWindow) {
                    activity.getWindow().setFlags(
                        android.view.WindowManager.LayoutParams.FLAG_SECURE,
                        android.view.WindowManager.LayoutParams.FLAG_SECURE
                    );
                }
                
                // Method 2: Set on current page's native view
                setTimeout(() => {
                    try {
                        const frame = Frame.topmost();
                        if (frame && frame.currentPage) {
                            const page = frame.currentPage;
                            if (page && page.nativeView) {
                                page.nativeView.setSecure(true);
                            }
                        }
                    } catch (e) {
                        console.error('Error setting secure on page:', e);
                    }
                }, 100);
            } catch (error) {
                console.error('Error setting screenshot prevention:', error);
            }
        }
    });

    function retry() {
        loadError = null;
        isLoading = true;
        attempt += 1;
    }

    function goBack() {
        stopPolling();
        if (saveTimer) clearTimeout(saveTimer);

        // End reading session to track duration
        endReadingSession();

        // Save progress before leaving
        if (totalPages > 0) {
            saveReadingProgress(book.id, furthestPage, totalPages, progressPercentage);
        }
        
        // Pop back to the book details page rather than pushing a new copy of
        // it onto the navigation stack.
        Frame.topmost()?.goBack();
    }

    async function toggleBookmark() {
        if (!totalPages || bookmarkBusy) return;

        const page = currentPage;
        const before = bookmarks;
        bookmarkBusy = true;
        bookmarkError = '';

        try {
            if (before.includes(page)) {
                bookmarks = before.filter((n) => n !== page);
                bookmarks = await removeBookmark(book.id, page);
            } else {
                bookmarks = [...before, page].sort((a, b) => a - b);
                bookmarks = await addBookmark(book.id, page);
            }
        } catch (error) {
            console.error('Could not change the bookmark:', error);
            bookmarks = before;
            bookmarkError = 'Could not save the bookmark. Please try again.';
            showBookmarks = true;
        } finally {
            bookmarkBusy = false;
        }
    }

    async function deleteBookmark(page: number) {
        const before = bookmarks;
        bookmarks = before.filter((n) => n !== page);
        bookmarkError = '';

        try {
            bookmarks = await removeBookmark(book.id, page);
        } catch (error) {
            console.error('Could not remove the bookmark:', error);
            bookmarks = before;
            bookmarkError = 'Could not remove the bookmark. Please try again.';
        }
    }

    // Reload the book with a page param. Drive it through the reactive
    // readerUrl declaration: assigning readerUrl directly does not work,
    // because bumping `attempt` re-runs the `$:` statement, which
    // overwrites the assignment with a URL that has no page param.
    function reloadAtPage(page: number) {
        jumpPage = page;
        attempt += 1;
        isLoading = true;
    }

    function goToPage(target: number) {
        if (!target) return;
        showBookmarks = false;

        // Prefer scrolling inside the already-loaded WebView — reloading the
        // whole PDF just to jump pages is slow on big books. The reader page
        // renders one canvas.pdf-page per page, in order, and scrolls on the
        // window, so scrollIntoView on the target canvas is enough.
        const view = resolveWebView();
        const native = view?.android;
        if (isAndroid && native && typeof native.evaluateJavascript === 'function') {
            const js =
                '(function(){' +
                `var c=document.querySelectorAll('canvas.pdf-page')[${target - 1}];` +
                'if(!c)return false;' +
                "c.scrollIntoView({behavior:'smooth',block:'start'});" +
                'return true;})()';
            try {
                native.evaluateJavascript(js, new android.webkit.ValueCallback({
                    onReceiveValue(value: any) {
                        if (String(value) === 'true') {
                            // The 1s progress poll confirms the page shortly;
                            // update immediately so the counter doesn't lag.
                            currentPage = target;
                        } else {
                            // Target page not rendered yet (book still
                            // drawing) — fall back to a reload, which waits
                            // for render and then scrolls server-side.
                            reloadAtPage(target);
                        }
                    }
                }));
            } catch (error) {
                console.error('Bookmark scroll failed, reloading instead:', error);
                reloadAtPage(target);
            }
        } else {
            reloadAtPage(target);
        }
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

    /* The same Back button as every other screen, in white on the navy bar. */
    .reader-back {
        background-color: transparent;
        color: white;
        font-size: 14;
        font-weight: bold;
        border-width: 2;
        border-color: white;
        border-radius: 100;
        height: 36;
        padding: 0 14;
        margin: 4 0 0 0;
        text-transform: none;
    }

    .reader-back:highlighted {
        background-color: white;
        color: #033047;
    }

    .reader-title {
        color: white;
        font-size: 17;
        font-weight: bold;
        vertical-align: center;
        margin: 8 0 0 6;
        text-transform: capitalize;
    }

    .reader-tools {
        margin-top: 6;
    }

    .reader-page-counter {
        color: white;
        font-size: 14;
        vertical-align: center;
        margin-left: 12;
    }

    /* Small outlined pills on the navy bar, the app's button shape. */
    .reader-bookmark,
    .reader-bookmark-list {
        color: white;
        font-size: 13;
        font-weight: bold;
        background-color: transparent;
        border-width: 2;
        border-color: white;
        border-radius: 100;
        height: 36;
        padding: 0 12;
        margin: 0 0 0 8;
        text-transform: none;
    }

    .reader-bookmark.highlighted {
        background-color: #ffd700;
        border-color: #ffd700;
        color: #033047;
    }

    .bookmark-panel {
        background-color: white;
        padding: 8 12 10 12;
        border-bottom-width: 2;
        border-bottom-color: #033047;
    }

    .bookmark-panel-title {
        font-size: 13;
        color: #6f6e6a;
        margin-bottom: 6;
    }

    .bookmark-error {
        font-size: 13;
        color: #b3261e;
        margin-bottom: 6;
    }

    .bookmark-row {
        height: 48;
        border-bottom-width: 1;
        border-bottom-color: #eeeeee;
    }

    .bookmark-row-here {
        background-color: #d8e2e9;
    }

    .bookmark-page {
        font-size: 16;
        color: #201e1d;
        vertical-align: center;
        padding-left: 8;
    }

    .bookmark-row-here .bookmark-page {
        font-weight: bold;
        color: #033047;
    }

    .bookmark-remove {
        color: #b3261e;
        font-size: 16;
        background-color: transparent;
        border-width: 0;
        width: 48;
        height: 48;
        margin: 0;
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
