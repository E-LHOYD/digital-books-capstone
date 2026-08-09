<page>
    <stackLayout class="container">

        <!-- Cover -->
        <stackLayout class="detail-cover">
            <label text="image" class="cover-text" />
        </stackLayout>

        <!-- Title -->
        <label text={book.title} class="detail-title" />

        <!-- Author -->
        <label text={book.author} class="detail-author" />

        <!-- Description -->
        <label text={book.detail || 'No description available'} textWrap="true" class="detail-description" />

        <!-- Debug Info -->
        {#if book.megaFileUrl}
            <stackLayout class="debug-info">
                <label text="MEGA URL available" class="debug-label" />
                <label text={book.megaFileUrl.substring(0, 50) + '...'} class="debug-url" textWrap="true" />
            </stackLayout>
        {:else}
            <stackLayout class="debug-info error">
                <label text="No MEGA URL available" class="debug-label" />
            </stackLayout>
        {/if}

        <!-- Loading Status -->
        {#if isLoading}
            <stackLayout class="status-container">
                <label text="Loading book for reading..." class="status-text" />
            </stackLayout>
        {/if}

        {#if streamError}
            <stackLayout class="error-container">
                <label text={streamError} class="error-text" />
            </stackLayout>
        {/if}

        <!-- Buttons Row -->
        <stackLayout orientation="horizontal" class="buttons-row">
            <button text="Read Book" class="btn btn-primary" on:tap={readBook} disabled={isLoading} />
            <button text="Read Later" class="btn btn-secondary" />
        </stackLayout>

        <!-- Back Button -->
        <button text="Back" class="btn btn-back" on:tap={goBack} />

    </stackLayout>
</page>

<script lang="ts">
    import { navigate } from '@nativescript-community/svelte-native';
    import Home from './Home.svelte';
    import { getMegaStreamUrl, getDirectMegaUrl } from '../services/mega.js';

    export let book: any;
    let isLoading = false;
    let streamError: string | null = null;
    let streamUrl: string | null = null;

    async function readBook() {
        console.log("Reading book:", book.title);
        console.log("Book data:", JSON.stringify(book));
        
        if (!book.megaFileUrl) {
            streamError = "This book is not available for reading - no MEGA URL found";
            console.error("No MEGA URL in book data");
            alert("Error: This book is not available for reading");
            return;
        }

        console.log("MEGA URL found:", book.megaFileUrl);
        isLoading = true;
        streamError = null;

        try {
            // Get stream URL from MEGA
            console.log("Attempting to get stream URL...");
            streamUrl = await getMegaStreamUrl(book.megaFileUrl);
            
            console.log("Stream URL obtained successfully:", streamUrl);
            
            // TODO: Implement PDF reading functionality with the stream URL
            // For now, just show success with the stream URL
            alert(`Book ready for streaming!\nStream URL: ${streamUrl}`);
            
        } catch (error) {
            console.error("Error getting stream URL:", error);
            console.error("Error message:", error.message);
            streamError = `Failed to load book: ${error.message}`;
            
            // Fallback to direct MEGA URL
            streamUrl = getDirectMegaUrl(book.megaFileUrl);
            console.log("Using direct MEGA URL as fallback:", streamUrl);
            alert(`Book ready for reading using direct URL!\nURL: ${streamUrl}`);
        } finally {
            isLoading = false;
        }
    }

    function goBack() {
        navigate({
            page: Home
        } as any);
    }
</script>

<style>
    .container {
        padding: 20;
        align-items: center;
    }

    .detail-cover {
        width: 200;
        height: 200;
        border-radius: 8;
        margin-bottom: 20;
        background-color: #f0f0f0;
        justify-content: center;
        align-items: center;
    }

    .cover-text {
        font-size: 16;
        color: #666;
        text-align: center;
    }

    .detail-title {
        font-size: 24;
        font-weight: bold;
        color: #033047;
        margin-bottom: 10;
        text-align: center;
    }

    .detail-author {
        font-size: 18;
        color: #666;
        margin-bottom: 20;
        text-align: center;
    }

    .detail-description {
        font-size: 16;
        color: #333;
        margin-bottom: 30;
        padding: 0 10;
        text-align: center;
    }

    .buttons-row {
        margin-bottom: 20;
    }

    .btn {
        font-size: 18;
        font-weight: bold;
        padding: 15 30;
        border-radius: 8;
        border-width: 0;
        margin: 0 5;
    }

    .btn-primary {
        background-color: #033047;
        color: white;
    }

    .btn-secondary {
        background-color: #f0f0f0;
        color: #033047;
        border-width: 2;
        border-color: #033047;
    }

    .btn-back {
        background-color: #666;
        color: white;
        width: 200;
    }

    .status-container {
        padding: 15;
        background-color: #e3f2fd;
        border-radius: 8;
        margin-bottom: 20;
        width: 100%;
    }

    .status-text {
        font-size: 16;
        color: #1976d2;
        text-align: center;
        font-weight: bold;
    }

    .error-container {
        padding: 15;
        background-color: #ffebee;
        border-radius: 8;
        margin-bottom: 20;
        width: 100%;
    }

    .error-text {
        font-size: 14;
        color: #c62828;
        text-align: center;
    }

    .debug-info {
        padding: 10;
        background-color: #f5f5f5;
        border-radius: 8;
        margin-bottom: 20;
        width: 100%;
        border-width: 1;
        border-color: #ddd;
    }

    .debug-info.error {
        background-color: #fff3f0;
        border-color: #ffccc7;
    }

    .debug-label {
        font-size: 12;
        color: #666;
        font-weight: bold;
        margin-bottom: 5;
    }

    .debug-url {
        font-size: 10;
        color: #999;
        font-family: monospace;
    }
</style>