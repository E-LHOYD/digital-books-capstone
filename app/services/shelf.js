import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore';
import { Auth } from '@nativescript/firebase-auth';

/**
 * Get user's shelves from Firestore
 */
export async function getUserShelves(userId) {
    try {
        const shelvesDoc = await firebase()
            .firestore()
            .collection('userShelves')
            .doc(userId)
            .get();

        if (shelvesDoc.exists) {
            const data = shelvesDoc.data();
            let shelves = data?.shelves || [];
            
            // Ensure read shelf exists
            if (!shelves.find(s => s.isReadShelf)) {
                shelves.push({
                    id: 'read',
                    name: 'Read',
                    userId,
                    isReadShelf: true,
                    createdAt: new Date(),
                    bookIds: []
                });
            }
            
            return shelves;
        }
        
        // Return default with read shelf if no data exists
        return [{
            id: 'read',
            name: 'Read',
            userId,
            isReadShelf: true,
            createdAt: new Date(),
            bookIds: []
        }];
    } catch (error) {
        console.error('Error getting user shelves:', error);
        return [];
    }
}

/**
 * Save user's shelves to Firestore
 */
export async function saveUserShelves(userId, shelves) {
    try {
        await firebase()
            .firestore()
            .collection('userShelves')
            .doc(userId)
            .set({
                userId,
                shelves,
                customShelfCount: shelves.filter(s => !s.isReadShelf).length
            }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error saving user shelves:', error);
        return false;
    }
}

/**
 * Create a new custom shelf
 */
export async function createCustomShelf(userId, name) {
    try {
        const shelves = await getUserShelves(userId);
        
        // Check if user already has 5 custom shelves
        const customShelves = shelves.filter(s => !s.isReadShelf);
        if (customShelves.length >= 5) {
            throw new Error('Maximum 5 custom shelves reached');
        }

        const newShelf = {
            id: Date.now().toString(),
            name,
            userId,
            isReadShelf: false,
            createdAt: new Date(),
            bookIds: []
        };

        shelves.push(newShelf);
        await saveUserShelves(userId, shelves);
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
        const shelves = await getUserShelves(userId);
        let shelf = shelves.find(s => s.id === shelfId);
        
        // Auto-create read shelf if it doesn't exist
        if (!shelf && shelfId === 'read') {
            shelf = {
                id: 'read',
                name: 'Read',
                userId,
                isReadShelf: true,
                createdAt: new Date(),
                bookIds: []
            };
            shelves.push(shelf);
        }
        
        if (!shelf) {
            throw new Error('Shelf not found');
        }

        if (shelf.bookIds.includes(bookId)) {
            throw new Error('Book already in shelf');
        }

        shelf.bookIds.push(bookId);
        await saveUserShelves(userId, shelves);
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
        const shelves = await getUserShelves(userId);
        const shelf = shelves.find(s => s.id === shelfId);
        
        if (!shelf) {
            throw new Error('Shelf not found');
        }

        shelf.bookIds = shelf.bookIds.filter(id => id !== bookId);
        await saveUserShelves(userId, shelves);
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
        const shelves = await getUserShelves(userId);
        const filteredShelves = shelves.filter(s => s.id !== shelfId);
        
        if (filteredShelves.length === shelves.length) {
            throw new Error('Shelf not found');
        }

        await saveUserShelves(userId, filteredShelves);
        return true;
    } catch (error) {
        console.error('Error deleting custom shelf:', error);
        throw error;
    }
}

/**
 * Get current user ID
 */
export function getCurrentUserId() {
    const auth = Auth();
    const user = auth.currentUser;
    return user ? user.uid : null;
}