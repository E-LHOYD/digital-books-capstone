import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore';
import { Auth } from '@nativescript/firebase-auth';

/**
 * Get current user ID
 */
export function getCurrentUserId() {
    const auth = Auth();
    const user = auth.currentUser;
    return user ? user.uid : null;
}

/**
 * Get user's shelves from Firestore
 * Structure: shelves/{userId}/userShelves/{shelfId}
 */
export async function getUserShelves(userId) {
    try {
        const shelvesSnapshot = await firebase()
            .firestore()
            .collection('shelves')
            .doc(userId)
            .collection('userShelves')
            .get();

        const shelves = [];
        shelvesSnapshot.forEach(doc => {
            shelves.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Ensure read shelf exists
        if (!shelves.find(s => s.id === 'read')) {
            shelves.push({
                id: 'read',
                name: 'Read',
                userId,
                isReadShelf: true,
                isViewedShelf: false,
                createdAt: new Date(),
                bookIds: []
            });
        }

        // Ensure viewed shelf exists
        if (!shelves.find(s => s.id === 'viewed')) {
            shelves.push({
                id: 'viewed',
                name: 'Viewed',
                userId,
                isReadShelf: false,
                isViewedShelf: true,
                createdAt: new Date(),
                bookIds: []
            });
        }

        return shelves;
    } catch (error) {
        console.error('Error getting user shelves:', error);
        return [];
    }
}

/**
 * Save a single shelf to Firestore
 */
export async function saveShelf(userId, shelf) {
    try {
        await firebase()
            .firestore()
            .collection('shelves')
            .doc(userId)
            .collection('userShelves')
            .doc(shelf.id)
            .set(shelf);
        return true;
    } catch (error) {
        console.error('Error saving shelf:', error);
        return false;
    }
}

/**
 * Create a new custom shelf
 */
export async function createCustomShelf(userId, name) {
    try {
        const shelves = await getUserShelves(userId);
        
        // Check if user already has 5 custom shelves (excluding read and viewed shelves)
        const customShelves = shelves.filter(s => !s.isReadShelf && !s.isViewedShelf);
        if (customShelves.length >= 5) {
            throw new Error('Maximum 5 custom shelves reached');
        }

        const newShelf = {
            id: Date.now().toString(),
            name,
            userId,
            isReadShelf: false,
            isViewedShelf: false,
            createdAt: new Date(),
            bookIds: []
        };

        await saveShelf(userId, newShelf);
        return newShelf;
    } catch (error) {
        console.error('Error creating custom shelf:', error);
        throw error;
    }
}

/**
 * Add book to a shelf
 */
export async function addBookToShelf(userId, shelfId, bookId) {
    try {
        const shelfDoc = await firebase()
            .firestore()
            .collection('shelves')
            .doc(userId)
            .collection('userShelves')
            .doc(shelfId)
            .get();

        if (!shelfDoc.exists) {
            // Auto-create read or viewed shelf if it doesn't exist
            const isReadShelf = shelfId === 'read';
            const isViewedShelf = shelfId === 'viewed';
            
            const newShelf = {
                id: shelfId,
                name: isReadShelf ? 'Read' : 'Viewed',
                userId,
                isReadShelf,
                isViewedShelf,
                createdAt: new Date(),
                bookIds: [bookId]
            };

            await saveShelf(userId, newShelf);
            return true;
        }

        const shelf = shelfDoc.data();
        if (shelf.bookIds && shelf.bookIds.includes(bookId)) {
            throw new Error('Book already in shelf');
        }

        const updatedBookIds = shelf.bookIds || [];
        updatedBookIds.push(bookId);

        await firebase()
            .firestore()
            .collection('shelves')
            .doc(userId)
            .collection('userShelves')
            .doc(shelfId)
            .update({
                bookIds: updatedBookIds
            });

        return true;
    } catch (error) {
        console.error('Error adding book to shelf:', error);
        throw error;
    }
}

/**
 * Remove book from a shelf
 */
export async function removeBookFromShelf(userId, shelfId, bookId) {
    try {
        const shelfDoc = await firebase()
            .firestore()
            .collection('shelves')
            .doc(userId)
            .collection('userShelves')
            .doc(shelfId)
            .get();

        if (!shelfDoc.exists) {
            throw new Error('Shelf not found');
        }

        const shelf = shelfDoc.data();
        const updatedBookIds = (shelf.bookIds || []).filter(id => id !== bookId);

        await firebase()
            .firestore()
            .collection('shelves')
            .doc(userId)
            .collection('userShelves')
            .doc(shelfId)
            .update({
                bookIds: updatedBookIds
            });

        return true;
    } catch (error) {
        console.error('Error removing book from shelf:', error);
        throw error;
    }
}

/**
 * Delete a custom shelf
 */
export async function deleteCustomShelf(userId, shelfId) {
    try {
        await firebase()
            .firestore()
            .collection('shelves')
            .doc(userId)
            .collection('userShelves')
            .doc(shelfId)
            .delete();
        return true;
    } catch (error) {
        console.error('Error deleting custom shelf:', error);
        throw error;
    }
}
