<page actionBarHidden={true} class="page">
    <gridLayout rows="auto, auto, auto, *, auto" columns="*" class="container">
        <label row={0} col={0} text="Recommended for You" class="header-title" />

        <!-- Academic profile -->
        <stackLayout row={1} col={0} class="profile-container">
            {#if isLoadingProfile}
                <label text="Reading your academic profile..." class="loading-text" />
            {:else if profileError}
                <label text={profileError} class="profile-error" textWrap={true} />
            {:else}
                <label text="Your Academic Profile" class="profile-title" />
                <label
                    text="{isSeniorHigh(profile) ? 'Grade' : 'Year level'}: {level || 'not set'}"
                    class="profile-item"
                />
                <label
                    text="{isSeniorHigh(profile) ? 'Strand' : 'Course'}: {track || 'not set'}"
                    class="profile-item"
                />
                <label text={reason} class="profile-note" textWrap={true} />
            {/if}
        </stackLayout>

        <label row={2} col={0} text="Books for You" class="section-title" />

        {#if isLoading}
            <label row={3} col={0} text="Finding recommendations..." class="loading-text" />
        {:else if loadError}
            <label row={3} col={0} text={loadError} class="profile-error" textWrap={true} />
        {:else if recommendedBooks.length === 0}
            <label
                row={3}
                col={0}
                text="No books match your year level yet. Ask your librarian to tag books for your level."
                class="empty-text"
                textWrap={true}
            />
        {:else}
            <scrollView row={3} col={0} class="books-scroll">
                <stackLayout>
                    {#each recommendedBooks as book (book.id)}
                        <stackLayout class="book-item" on:tap={() => goToBookDetails(book)}>
                            <label text={book.title} class="book-title" textWrap={true} />
                            <label text={book.author} class="book-author" />
                            {#if subjectLine(book)}
                                <label text={subjectLine(book)} class="book-subject" />
                            {/if}
                        </stackLayout>
                    {/each}
                </stackLayout>
            </scrollView>
        {/if}

        <button row={4} col={0} text="Back to Home" class="back-btn" on:tap={goBack} />
    </gridLayout>
</page>

<script lang="ts">
    import { onMount } from 'svelte';
    import { firebase } from '@nativescript/firebase-core';
    import '@nativescript/firebase-firestore';
    import '@nativescript/firebase-auth';
    import { navigate } from '@nativescript-community/svelte-native';
    import Home from './Home.svelte';
    import BookDetails from './BookDetails.svelte';
    import { bookSubjects } from '../services/subjects';
    import { studentLevel, isSeniorHigh } from '../services/yearLevels';
    import { recommendBooks, recommendationReason, studentTrack } from '../services/recommendations';

    let profile: any = null;
    let profileError = '';
    let loadError = '';
    let isLoadingProfile = true;
    let isLoading = true;
    let recommendedBooks: any[] = [];
    let allBooks: any[] = [];
    let reason = '';

    $: level = studentLevel(profile);
    $: track = studentTrack(profile);

    onMount(async () => {
        // Both are needed before anything can be ranked, and neither depends on
        // the other, so they run together.
        await Promise.all([loadProfile(), loadAllBooks()]);
        recommendedBooks = await recommendBooks(allBooks, profile);
        reason = await recommendationReason(profile);
        isLoading = false;
    });

    async function loadProfile() {
        isLoadingProfile = true;
        profileError = '';

        try {
            const currentUser = firebase().auth().currentUser;

            if (!currentUser) {
                profileError = 'Sign in to see books picked for your year level.';
                return;
            }

            const userDoc = await firebase()
                .firestore()
                .collection('users')
                .doc(currentUser.uid)
                .get();

            if (!userDoc.exists) {
                // Previously this invented a "2nd Year Computer Science" profile,
                // so every student with no record silently got someone else's
                // recommendations. Better to say the profile is missing.
                profileError = 'Your academic profile is missing. Complete it to get recommendations.';
                return;
            }

            profile = userDoc.data();
        } catch (err) {
            console.error('Could not read the academic profile:', err);
            profileError = 'Could not read your academic profile.';
        } finally {
            isLoadingProfile = false;
        }
    }

    async function loadAllBooks() {
        loadError = '';

        try {
            const snapshot = await firebase().firestore().collection('books').get();

            allBooks = snapshot.docs.map((doc) => {
                const data: any = doc.data();
                const title = data.title ?? '';
                // Matches the shape Home builds, so BookDetails behaves the same
                // whether a book was opened from the library or from here.
                const cleanTitle = String(title).replace(/\s+/g, '').toLowerCase();

                return {
                    id: doc.id,
                    title,
                    author: data.author ?? '',
                    detail: data.detail || '',
                    fileUrl: data.fileUrl || null,
                    publishedDate: data.publishedDate || null,
                    releaseDate: data.releaseDate || null,
                    subjects: data.subjects || null,
                    subject: data.subject || null,
                    yearLevels: data.yearLevels || null,
                    coverPath: `~/ebooks/cover/${cleanTitle}cover.jpg`,
                    fallbackCover: '~/images/bookcoverbrown.jpg'
                };
            });
        } catch (err) {
            console.error('Could not load books:', err);
            loadError = 'Could not load books. Please try again.';
        }
    }

    function subjectLine(book: any): string {
        return bookSubjects(book).join(', ');
    }

    function goToBookDetails(book: any) {
        navigate({
            page: BookDetails,
            props: { book }
        } as any);
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
        background-color: #f5f5f5;
    }

    .header-title {
        font-size: 28;
        font-weight: bold;
        color: #033047;
        text-align: center;
        margin-bottom: 20;
    }

    .profile-container {
        background-color: white;
        border-radius: 12;
        padding: 20;
        margin-bottom: 20;
    }

    .profile-title {
        font-size: 18;
        font-weight: bold;
        color: #033047;
        text-align: center;
        margin-bottom: 15;
    }

    .profile-item {
        font-size: 16;
        color: #333;
        margin-bottom: 8;
    }

    .profile-note {
        font-size: 13;
        color: #666;
        margin-top: 6;
    }

    .profile-error {
        font-size: 15;
        color: #d32f2f;
        text-align: center;
    }

    .section-title {
        font-size: 20;
        font-weight: bold;
        color: #033047;
        margin-bottom: 10;
    }

    .loading-text,
    .empty-text {
        font-size: 16;
        color: #666;
        text-align: center;
        padding: 20;
    }

    .books-scroll {
        background-color: white;
        border-width: 1;
        border-color: #eee;
        border-radius: 8;
        margin-bottom: 20;
    }

    .book-item {
        padding: 15;
        border-bottom-width: 1;
        border-bottom-color: #f0f0f0;
        background-color: white;
    }

    .book-item:active {
        background-color: #f8f8f8;
    }

    .book-title {
        font-size: 16;
        font-weight: bold;
        color: #033047;
        margin-bottom: 5;
    }

    .book-author {
        font-size: 14;
        color: #666;
    }

    .book-subject {
        font-size: 12;
        color: #8a8a8a;
        margin-top: 4;
    }

    .back-btn {
        background-color: #666;
        color: white;
        font-size: 16;
        font-weight: bold;
        padding: 12 25;
        border-radius: 8;
        border-width: 0;
    }
</style>
