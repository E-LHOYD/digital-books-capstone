import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore';
import { Auth } from '@nativescript/firebase-auth';

/**
 * Reading progress threshold constants
 */
// `percentage` is on a 0-100 scale, but this was compared against 0.05, so
// anything past a twentieth of one percent counted as "read" and a book could
// never be merely "viewed". At or above this share counts as read.
const READ_THRESHOLD_PERCENT = 10;

/**
 * Reading session tracking
 */
let currentSessionStart = null;
let currentBookId = null;

/**
 * Start a reading session for a book
 */
export function startReadingSession(bookId) {
    currentBookId = bookId;
    currentSessionStart = new Date();
    console.log(`Started reading session for book ${bookId} at ${currentSessionStart}`);
}

/**
 * End the current reading session and update duration
 */
export async function endReadingSession() {
    if (!currentSessionStart || !currentBookId) {
        console.log('No active reading session to end');
        return;
    }

    const sessionEnd = new Date();
    const sessionDurationMs = sessionEnd - currentSessionStart;
    const sessionDurationMinutes = Math.round(sessionDurationMs / 1000 / 60);

    console.log(`Ended reading session for book ${currentBookId}. Duration: ${sessionDurationMinutes} minutes`);

    try {
        const userId = getCurrentUserId();
        if (!userId) return;

        const progressDoc = await firebase()
            .firestore()
            .collection('readingProgress')
            .doc(`${userId}_${currentBookId}`)
            .get();

        const existingData = progressDoc.exists ? progressDoc.data() : {};
        const totalDurationMinutes = (existingData.totalDurationMinutes || 0) + sessionDurationMinutes;
        const sessionCount = (existingData.sessionCount || 0) + 1;

        await firebase()
            .firestore()
            .collection('readingProgress')
            .doc(`${userId}_${currentBookId}`)
            .set({
                ...existingData,
                userId,
                bookId: currentBookId,
                totalDurationMinutes,
                sessionCount,
                lastSessionDuration: sessionDurationMinutes,
                lastSessionEndedAt: sessionEnd
            }, { merge: true });

        console.log(`Updated reading duration for book ${currentBookId}: ${totalDurationMinutes} total minutes, ${sessionCount} sessions`);
    } catch (error) {
        console.error('Error updating reading duration:', error);
    } finally {
        currentSessionStart = null;
        currentBookId = null;
    }
}

/**
 * Get total reading duration for a book
 */
export async function getReadingDuration(bookId) {
    try {
        const userId = getCurrentUserId();
        if (!userId) return 0;

        const progressDoc = await firebase()
            .firestore()
            .collection('readingProgress')
            .doc(`${userId}_${bookId}`)
            .get();

        if (progressDoc.exists) {
            return progressDoc.data().totalDurationMinutes || 0;
        }
        return 0;
    } catch (error) {
        console.error('Error getting reading duration:', error);
        return 0;
    }
}

/**
 * Get reading session count for a book
 */
export async function getReadingSessionCount(bookId) {
    try {
        const userId = getCurrentUserId();
        if (!userId) return 0;

        const progressDoc = await firebase()
            .firestore()
            .collection('readingProgress')
            .doc(`${userId}_${bookId}`)
            .get();

        if (progressDoc.exists) {
            return progressDoc.data().sessionCount || 0;
        }
        return 0;
    } catch (error) {
        console.error('Error getting reading session count:', error);
        return 0;
    }
}

/**
 * Get current user ID
 */
// Auth is a class in @nativescript/firebase-auth, so it must be constructed.
// Calling Auth() throws "Class constructor Auth cannot be invoked without 'new'".
// Built lazily so it is never constructed before Firebase has initialised.
let authInstance = null;

function getAuth() {
    if (!authInstance) {
        authInstance = new Auth();
    }
    return authInstance;
}

export function getCurrentUserId() {
    const user = getAuth().currentUser;
    return user ? user.uid : null;
}

/**
 * Get reading progress for a specific book
 */
export async function getReadingProgress(bookId) {
    try {
        const userId = getCurrentUserId();
        if (!userId) return null;

        const progressDoc = await firebase()
            .firestore()
            .collection('readingProgress')
            .doc(`${userId}_${bookId}`)
            .get();

        if (progressDoc.exists) {
            return progressDoc.data();
        }
        
        return null;
    } catch (error) {
        console.error('Error getting reading progress:', error);
        return null;
    }
}

/**
 * Save reading progress for a book and update shelves automatically
 */
export async function saveReadingProgress(bookId, currentPage, totalPages, percentage) {
    try {
        const userId = getCurrentUserId();
        if (!userId) return false;

        const previousProgress = await getReadingProgress(bookId);
        const previousStatus = previousProgress?.status || null;
        
        const progressData = {
            userId,
            bookId,
            currentPage,
            totalPages,
            percentage,
            lastReadAt: new Date(),
            // Determine status based on percentage
            // Page 1 is always just "viewed", whatever the percentage says: in a
            // ten page book the first page alone is already 10%, so percentage
            // on its own would call an unopened book read.
            status:
                currentPage <= 1
                    ? 'viewed'
                    : percentage >= READ_THRESHOLD_PERCENT
                      ? 'read'
                      : 'viewed'
        };

        await firebase()
            .firestore()
            .collection('readingProgress')
            .doc(`${userId}_${bookId}`)
            .set(progressData, { merge: true });

        // Update shelves based on reading progress
        await updateShelfBasedOnProgress(userId, bookId, progressData.status, previousStatus);

        return true;
    } catch (error) {
        console.error('Error saving reading progress:', error);
        return false;
    }
}

/**
 * Update shelf based on reading progress
 */
async function updateShelfBasedOnProgress(userId, bookId, currentStatus, previousStatus) {
    try {
        // Import shelf functions
        const { addBookToShelf, removeBookFromShelf } = await import('./shelf.js');

        // If status changed from viewed to read, move from viewed to read shelf
        if (previousStatus === 'viewed' && currentStatus === 'read') {
            await removeBookFromShelf(userId, 'viewed', bookId);
            await addBookToShelf(userId, 'read', bookId);
        }
        // If status changed from read to viewed, move from read to viewed shelf
        else if (previousStatus === 'read' && currentStatus === 'viewed') {
            await removeBookFromShelf(userId, 'read', bookId);
            await addBookToShelf(userId, 'viewed', bookId);
        }
        // If no previous status, add to appropriate shelf
        else if (!previousStatus) {
            if (currentStatus === 'read') {
                await addBookToShelf(userId, 'read', bookId);
            } else {
                await addBookToShelf(userId, 'viewed', bookId);
            }
        }
    } catch (error) {
        console.error('Error updating shelf based on progress:', error);
        // Don't throw error here as progress saving should still succeed
    }
}

/**
 * Get all reading progress for current user
 */
export async function getAllReadingProgress() {
    try {
        const userId = getCurrentUserId();
        if (!userId) return [];

        const progressSnapshot = await firebase()
            .firestore()
            .collection('readingProgress')
            .where('userId', '==', userId)
            .get();

        const progressList = [];
        progressSnapshot.forEach(doc => {
            progressList.push(doc.data());
        });

        return progressList;
    } catch (error) {
        console.error('Error getting all reading progress:', error);
        return [];
    }
}

/**
 * Get books with 'read' status (>5% read)
 */
export async function getReadBooks() {
    try {
        const userId = getCurrentUserId();
        if (!userId) return [];

        const progressSnapshot = await firebase()
            .firestore()
            .collection('readingProgress')
            .where('userId', '==', userId)
            .where('status', '==', 'read')
            .get();

        const bookIds = [];
        progressSnapshot.forEach(doc => {
            bookIds.push(doc.data().bookId);
        });

        return bookIds;
    } catch (error) {
        console.error('Error getting read books:', error);
        return [];
    }
}

/**
 * Get books with 'viewed' status (<5% read)
 */
export async function getViewedBooks() {
    try {
        const userId = getCurrentUserId();
        if (!userId) return [];

        const progressSnapshot = await firebase()
            .firestore()
            .collection('readingProgress')
            .where('userId', '==', userId)
            .where('status', '==', 'viewed')
            .get();

        const bookIds = [];
        progressSnapshot.forEach(doc => {
            bookIds.push(doc.data().bookId);
        });

        return bookIds;
    } catch (error) {
        console.error('Error getting viewed books:', error);
        return [];
    }
}

/**
 * Delete reading progress for a book
 */
export async function deleteReadingProgress(bookId) {
    try {
        const userId = getCurrentUserId();
        if (!userId) return false;

        await firebase()
            .firestore()
            .collection('readingProgress')
            .doc(`${userId}_${bookId}`)
            .delete();

        return true;
    } catch (error) {
        console.error('Error deleting reading progress:', error);
        return false;
    }
}

/**
 * Set bookmark for a book at specific page
 */
export async function setBookmark(bookId, pageNumber) {
    try {
        const userId = getCurrentUserId();
        if (!userId) return false;

        const progressDoc = await firebase()
            .firestore()
            .collection('readingProgress')
            .doc(`${userId}_${bookId}`)
            .get();

        const existingData = progressDoc.exists ? progressDoc.data() : {};
        
        await firebase()
            .firestore()
            .collection('readingProgress')
            .doc(`${userId}_${bookId}`)
            .set({
                ...existingData,
                userId,
                bookId,
                bookmark: pageNumber,
                bookmarkedAt: new Date()
            }, { merge: true });

        return true;
    } catch (error) {
        console.error('Error setting bookmark:', error);
        return false;
    }
}

/**
 * Remove bookmark for a book
 */
export async function removeBookmark(bookId) {
    try {
        const userId = getCurrentUserId();
        if (!userId) return false;

        const progressDoc = await firebase()
            .firestore()
            .collection('readingProgress')
            .doc(`${userId}_${bookId}`)
            .get();

        if (progressDoc.exists) {
            await firebase()
                .firestore()
                .collection('readingProgress')
                .doc(`${userId}_${bookId}`)
                .update({
                    bookmark: null,
                    bookmarkedAt: null
                });
        }

        return true;
    } catch (error) {
        console.error('Error removing bookmark:', error);
        return false;
    }
}

/**
 * Get bookmark for a book
 */
export async function getBookmark(bookId) {
    try {
        const userId = getCurrentUserId();
        if (!userId) return null;

        const progressDoc = await firebase()
            .firestore()
            .collection('readingProgress')
            .doc(`${userId}_${bookId}`)
            .get();

        if (progressDoc.exists) {
            const data = progressDoc.data();
            return data.bookmark || null;
        }
        
        return null;
    } catch (error) {
        console.error('Error getting bookmark:', error);
        return null;
    }
}
