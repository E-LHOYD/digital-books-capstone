import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore';
import { Auth } from '@nativescript/firebase-auth';

/**
 * Reading progress threshold constants
 */
const READ_THRESHOLD = 0.05; // 5% threshold for "viewed" vs "read"
const VIEWED_THRESHOLD = 0.05; // Below 5% is "viewed"

/**
 * Get current user ID
 */
export function getCurrentUserId() {
    const auth = Auth();
    const user = auth.currentUser;
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
 * Save reading progress for a book
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
            status: percentage >= READ_THRESHOLD ? 'read' : 'viewed'
        };

        await firebase()
            .firestore()
            .collection('readingProgress')
            .doc(`${userId}_${bookId}`)
            .set(progressData, { merge: true });

        // Update shelves based on reading progress (manual trigger)
        // This is handled by the shelf service when needed
        return { success: true, previousStatus, currentStatus: progressData.status };
    } catch (error) {
        console.error('Error saving reading progress:', error);
        return { success: false };
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
