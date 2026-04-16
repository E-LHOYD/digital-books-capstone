<page>
    <stackLayout class="container">
        <!-- Header -->
        <label text="Recommended for You" class="header-title" />
        
        <!-- User Profile Detection -->
        {#if isLoadingProfile}
            <stackLayout class="profile-container">
                <label text="Detecting your academic profile..." class="loading-text" />
            </stackLayout>
        {:else if userProfile}
            <stackLayout class="profile-container">
                <label text="Your Academic Profile" class="profile-title" />
                <stackLayout class="profile-details">
                    {#if userProfile.course.toLowerCase().includes('shs') || userProfile.course.toLowerCase().includes('senior high') || userProfile.course.toLowerCase().includes('grade 11') || userProfile.course.toLowerCase().includes('grade 12') || userProfile.yearLevel.toLowerCase().includes('grade')}
                        <label text="Grade: {userProfile.yearLevel}" class="profile-item" />
                        <label text="Strand: {userProfile.course}" class="profile-item" />
                    {:else}
                        <label text="Year Level: {userProfile.yearLevel}" class="profile-item" />
                        <label text="Course: {userProfile.course}" class="profile-item" />
                    {/if}
                </stackLayout>
            </stackLayout>
        {:else}
            <stackLayout class="profile-container">
                <label text="Profile not found" class="profile-error" />
                <label text="Please complete your academic profile first" class="profile-subtitle" />
            </stackLayout>
        {/if}
        
        <!-- Recommended Books -->
        {#if showRecommendations}
            <stackLayout class="recommendations-container">
                <label text="Books for You" class="section-title" />
                
                {#if isLoading}
                    <stackLayout class="loading-container">
                        <label text="Finding recommendations..." class="loading-text" />
                    </stackLayout>
                {:else if recommendedBooks.length === 0}
                    <stackLayout class="empty-container">
                        <label text="No recommendations found" class="empty-text" />
                    </stackLayout>
                {:else}
                    <scrollView class="books-scroll">
                        <stackLayout>
                            {#each recommendedBooks as book}
                                <stackLayout class="book-item" on:tap={() => goToBookDetails(book)}>
                                    <!-- Book Info -->
                                    <stackLayout class="book-info">
                                        <label text={book.title} class="book-title" />
                                        <label text={book.author} class="book-author" />
                                    </stackLayout>
                                </stackLayout>
                            {/each}
                        </stackLayout>
                    </scrollView>
                {/if}
            </stackLayout>
        {/if}
        
        <!-- Back Button -->
        <button text="Back to Home" class="back-btn" on:tap={goBack} />
    </stackLayout>
</page>

<script lang="ts">
    import { onMount } from 'svelte';
    import { firebase } from '@nativescript/firebase-core';
    import '@nativescript/firebase-firestore';
    import { navigate } from '@nativescript-community/svelte-native';
    import Home from './Home.svelte';
    import BookDetails from './BookDetails.svelte';
    import { Book, UserProfile } from '../types';

    let userProfile: UserProfile | null = null;
    let isLoadingProfile: boolean = false;
    let showRecommendations: boolean = false;
    let isLoading: boolean = false;
    let recommendedBooks: Book[] = [];
    let allBooks: Book[] = [];

    onMount(async () => {
        await loadAllBooks();
        await detectUserProfile();
        
        // Generate recommendations after both profile and books are loaded
        if (userProfile && allBooks.length > 0) {
            generateRecommendations();
        }
    });

    async function detectUserProfile() {
        isLoadingProfile = true;
        
        try {
            // Get current user (assuming Firebase Auth is set up)
            const currentUser = firebase().auth().currentUser;
            console.log("Current user:", currentUser?.uid, currentUser?.email);
            
            if (currentUser) {
                // Try to get user profile from Firestore
                const userDoc = await firebase()
                    .firestore()
                    .collection('users')
                    .doc(currentUser.uid)
                    .get();

                console.log("User doc exists:", userDoc.exists);
                
                if (userDoc.exists) {
                    const data = userDoc.data();
                    console.log("User profile data:", data);
                    
                    // Handle different data structures for SHS vs College students
                    if (data.type === 'shs' || data.grade || data.strand) {
                        // SHS student data structure
                        userProfile = {
                            userId: currentUser.uid,
                            email: currentUser.email || '',
                            yearLevel: data.grade || '',
                            course: data.strand || '',
                            createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt.toDate()) : new Date(),
                            lastUpdated: data.lastUpdated ? (typeof data.lastUpdated === 'string' ? new Date(data.lastUpdated) : data.lastUpdated.toDate()) : new Date()
                        };
                    } else {
                        // College student data structure
                        userProfile = {
                            userId: currentUser.uid,
                            email: currentUser.email || '',
                            yearLevel: data.year || data.yearLevel || '',
                            course: data.course || '',
                            createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt.toDate()) : new Date(),
                            lastUpdated: data.lastUpdated ? (typeof data.lastUpdated === 'string' ? new Date(data.lastUpdated) : data.lastUpdated.toDate()) : new Date()
                        };
                    }
                    
                    console.log("Final user profile:", userProfile);
                } else {
                    console.log("No user profile found in Firestore for user:", currentUser.uid);
                    // Create a sample profile for demo purposes
                    createSampleProfile(currentUser.uid, currentUser.email || '');
                }
            } else {
                console.log("No authenticated user found");
                // Create sample profile for demo
                createSampleProfile('demo-user', 'demo@example.com');
            }
        } catch (err) {
            console.error("Error detecting user profile:", err);
            // Create sample profile as fallback
            createSampleProfile('demo-user', 'demo@example.com');
        } finally {
            isLoadingProfile = false;
        }
    }

    function createSampleProfile(userId: string, email: string) {
        console.warn("Using fallback sample profile - real profile not found");
        // Create a sample profile for demonstration
        userProfile = {
            userId,
            email,
            yearLevel: '2nd Year',
            course: 'Computer Science',
            createdAt: new Date(),
            lastUpdated: new Date()
        };
        
        generateRecommendations();
    }

    async function updateUserProfile(profileData: Partial<UserProfile>) {
        try {
            const currentUser = firebase().auth().currentUser;
            if (!currentUser) {
                throw new Error("User not authenticated");
            }

            const userRef = firebase().firestore().collection('users').doc(currentUser.uid);
            
            const updateData = {
                ...profileData,
                lastUpdated: new Date()
            };

            await userRef.set(updateData, { merge: true } as any);
            console.log("Profile updated successfully");
            
            // Refresh the profile after update
            await detectUserProfile();
        } catch (error) {
            console.error("Error updating user profile:", error);
            throw error;
        }
    }

    async function loadAllBooks() {
        try {
            console.log("=== Loading all books for recommendations ===");
            const snapshot = await firebase()
                .firestore()
                .collection('books')
                .get();

            console.log("Firestore query completed. Found documents:", snapshot.docs.length);

            allBooks = snapshot.docs.map(doc => {
                const data = doc.data();
                console.log("Document data for", doc.id, ":", data);
                
                const title = data.title;
                const author = data.author;
                const detail = data.detail || '';
                const subject = data.subject || data.category || data.tags?.join(' ') || '';

                console.log("Book title:", title);
                console.log("Book author:", author);
                console.log("Book detail:", detail);
                console.log("Book subject:", subject);
                
                return {
                    title,
                    author,
                    detail,
                    subject
                };
            });

            console.log("Final allBooks array:", allBooks);
            console.log("Loaded books count:", allBooks.length);
        } catch (err) {
            console.error("Error loading books:", err);
        }
    }

    function generateRecommendations() {
        if (!userProfile) return;
        
        console.log("=== GENERATING RECOMMENDATIONS ===");
        console.log("User profile:", userProfile);
        console.log("All available books count:", allBooks.length);
        
        showRecommendations = true;
        isLoading = true;

        // Simulate processing delay
        setTimeout(() => {
            recommendedBooks = filterBooksByAcademicDetails();
            isLoading = false;
        }, 1000);
    }

    function filterBooksByAcademicDetails(): Book[] {
        if (!userProfile) return [];
        
        console.log("=== STARTING FILTERING ===");
        console.log("User profile:", userProfile);
        console.log("Total books available:", allBooks.length);
        
        let filtered = [...allBooks];
        const course = userProfile.course.toLowerCase();
        const yearLevel = userProfile.yearLevel.toLowerCase();
        
        console.log("=== COURSE ANALYSIS ===");
        console.log("Course value:", course);
        console.log("Year Level:", yearLevel);

        // Clean, focused filtering by course type
        if (course.includes('bscs') || course.includes('computer science')) {
            console.log("=== BSCS FILTERING ===");
            const bscsSubjects = [
                'computer science', 'technology', 'math', 'mathematics', 
                'programming', 'coding', 'algorithms', 'data structures',
                'Computer Science', 'Technology', 'Math', 'Mathematics', 
                'Programming', 'Coding', 'Algorithms', 'Data Structures'
            ];
            
            filtered = allBooks.filter(book => {
                const bookText = (book.title + ' ' + (book.detail || '') + ' ' + (book.subject || '')).toLowerCase();
                const hasSubject = bscsSubjects.some(subject => 
                    bookText.includes(subject)
                );
                console.log(`BSCS Match: "${book.title}" - Subject: ${book.subject} - Found: ${hasSubject}`);
                return hasSubject;
            });
            
        } else if (course.includes('abm') || course.includes('bsba') || course.includes('business')) {
            console.log("=== ABM/BSBA FILTERING ===");
            const businessSubjects = [
                'math', 'mathematics', 'economics', 'business', 'accounting', 
                'finance', 'marketing', 'management', 'entrepreneurship',
                'Math', 'Mathematics', 'Economics', 'Business', 'Accounting',
                'Finance', 'Marketing', 'Management', 'Entrepreneurship'
            ];
            
            filtered = allBooks.filter(book => {
                const bookText = (book.title + ' ' + (book.detail || '') + ' ' + (book.subject || '')).toLowerCase();
                const hasSubject = businessSubjects.some(subject => 
                    bookText.includes(subject)
                );
                console.log(`ABM Match: "${book.title}" - Subject: ${book.subject} - Found: ${hasSubject}`);
                return hasSubject;
            });
            
        } else if (course.includes('shs') || yearLevel.includes('grade')) {
            console.log("=== SHS FILTERING ===");
            const shsSubjects = [
                'math', 'mathematics', 'science', 'english', 'filipino', 
                'history', 'social studies', 'economics', 'biology', 'chemistry', 
                'physics', 'literature', 'research',
                'Math', 'Mathematics', 'Science', 'English', 'Filipino',
                'History', 'Social Studies', 'Economics', 'Biology', 
                'Chemistry', 'Physics', 'Literature', 'Research'
            ];
            
            filtered = allBooks.filter(book => {
                const bookText = (book.title + ' ' + (book.detail || '') + ' ' + (book.subject || '')).toLowerCase();
                const hasSubject = shsSubjects.some(subject => 
                    bookText.includes(subject)
                );
                console.log(`SHS Match: "${book.title}" - Subject: ${book.subject} - Found: ${hasSubject}`);
                return hasSubject;
            });
            
        } else {
            console.log("=== GENERAL FALLBACK ===");
            console.log("No specific course match, using general subjects");
            const generalSubjects = ['math', 'science', 'english', 'business'];
            
            filtered = allBooks.filter(book => {
                const bookText = (book.title + ' ' + (book.detail || '') + ' ' + (book.subject || '')).toLowerCase();
                const hasSubject = generalSubjects.some(subject => 
                    bookText.includes(subject)
                );
                console.log(`General Match: "${book.title}" - Subject: ${book.subject} - Found: ${hasSubject}`);
                return hasSubject;
            });
        }

        // Year level filtering - less restrictive to avoid removing valid books
        if (yearLevel.includes('grade 11') || yearLevel.includes('1st')) {
            console.log("=== GRADE 11/FIRST YEAR FILTERING ===");
            // Only filter out obviously advanced books, keep relevant ones
            filtered = filtered.filter(book => {
                const title = book.title.toLowerCase();
                const detail = book.detail?.toLowerCase() || '';
                // Don't filter out books that match the student's subjects
                const isAdvanced = title.includes('advanced') || title.includes('research') || 
                                 detail.includes('expert') || detail.includes('graduate');
                return !isAdvanced;
            });
        } else if (yearLevel.includes('grade 12') || yearLevel.includes('4th')) {
            console.log("=== GRADE 12/FOURTH YEAR FILTERING ===");
            // Prioritize advanced books but include relevant ones
            filtered = filtered.filter(book => {
                const title = book.title.toLowerCase();
                const detail = book.detail?.toLowerCase() || '';
                // Include advanced books OR relevant subject books
                const isAdvanced = title.includes('advanced') || title.includes('research') || 
                                 detail.includes('expert') || detail.includes('graduate');
                const isRelevant = title.includes('introduction') || title.includes('basic') || 
                                 detail.includes('beginner');
                return isAdvanced || isRelevant;
            });
        }

        // Final result
        const finalResult = filtered.slice(0, 10);
        console.log("=== FINAL RESULTS ===");
        console.log("Final recommendations:", finalResult.length);
        console.log("Final books:", finalResult.map(b => ({
            title: b.title,
            subject: b.subject,
            author: b.author
        })));
        
        return finalResult;
    }

    function goToBookDetails(book: Book) {
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
        box-shadow: 0 2 8px rgba(0,0,0,0.1);
    }

    .profile-title {
        font-size: 18;
        font-weight: bold;
        color: #033047;
        text-align: center;
        margin-bottom: 15;
    }

    .profile-details {
        margin-bottom: 10;
    }

    .profile-item {
        font-size: 16;
        color: #333;
        margin-bottom: 8;
        padding: 5 0;
    }

    .profile-error {
        font-size: 18;
        font-weight: bold;
        color: #d32f2f;
        text-align: center;
        margin-bottom: 10;
    }

    .profile-subtitle {
        font-size: 14;
        color: #666;
        text-align: center;
    }

    .recommendations-container {
        background-color: white;
        border-radius: 12;
        padding: 20;
        margin-bottom: 20;
        box-shadow: 0 2 8px rgba(0,0,0,0.1);
    }

    .section-title {
        font-size: 20;
        font-weight: bold;
        color: #033047;
        margin-bottom: 15;
    }

    .loading-container,
    .empty-container {
        padding: 20;
        text-align: center;
        vertical-align: center;
    }

    .loading-text,
    .empty-text {
        font-size: 16;
        color: #666;
    }

    .books-scroll {
        height: 400;
        border-width: 1;
        border-color: #eee;
        border-radius: 8;
    }

    .book-item {
        padding: 15;
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
        padding: 5 0;
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
        margin-bottom: 5;
    }

    .back-btn {
        background-color: #666;
        color: white;
        font-size: 16;
        font-weight: bold;
        padding: 12 25;
        border-radius: 8;
        border-width: 0;
        width: 200;
    }
</style>
