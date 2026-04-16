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

        <!-- Buttons Row -->
        <stackLayout orientation="horizontal" class="buttons-row">
            <button text="Read Book" class="btn btn-primary" on:tap={readBook} />
            <button text="Read Later" class="btn btn-secondary" />
        </stackLayout>

        <!-- Back Button -->
        <button text="Back" class="btn btn-back" on:tap={goBack} />

    </stackLayout>
</page>

<script lang="ts">
    import { Book } from '../types';
    import { navigate } from '@nativescript-community/svelte-native';
    import Home from './Home.svelte';

    export let book: Book;

    function readBook() {
        console.log("Reading book:", book.title);
        // TODO: Implement PDF reading functionality
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
</style>