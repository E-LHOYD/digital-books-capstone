// 🔥 Firebase Core
import { firebase } from '@nativescript/firebase-core';

// �� Auth
import { Auth } from '@nativescript/firebase-auth';

// 💾 Firestore
import { Firestore } from '@nativescript/firebase-firestore';

// Initialize Firebase (ONLY ONCE)
// Firebase is initialized automatically by the plugin

// Export initFirebase function for external use
export function initFirebase() {
    // Firebase is initialized automatically by the plugin
}

const auth = new Auth();
const db = new Firestore();


// =========================
// 🔐 LOGIN USER
// =========================
/**
 * Login user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<any>} User credential object
 */
export async function login(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        return user;
    } catch (error) {
        throw error;
    }
}

// =========================
// 🔐 REGISTER USER
// =========================
/**
 * Register a new user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<any>} User credential object
 */
export async function register(email, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        return user;
    } catch (error) {
        throw error;
    }
}





// =========================
// 📚 ADD BOOK TO SHELF
// =========================
/**
 * Add a book to user's shelf in Firestore
 * @param {string} shelf - The shelf name (e.g., 'reading', 'completed')
 * @param {Object} book - Book object with title and author
 * @param {string} book.title - Book title
 * @param {string} book.author - Book author
 * @returns {Promise<any>} Firestore document reference
 */

// =========================
// // Get User by Username
// =========================
/**
 * Get user from Firestore by username
 * @param {string} username - User's username
 * @returns {Promise<Object>} User document data
 */
export async function getUserByUsername(username) {
    try {
        const usersRef = db.collection('users');
        const query = await usersRef.where('username', '==', username).get();
        
        if (query.empty) {
            throw new Error('User not found with this username');
        }
        
        const userDoc = query.docs[0];
        return userDoc.data();
    } catch (error) {
        throw error;
    }
}

// =========================
// // ADD BOOK TO SHELF
// =========================
/**
 * Add a book to user's shelf in Firestore
 * @param {string} shelf - The shelf name (e.g., 'reading', 'completed')
 * @param {Object} book - Book object with title and author
 * @param {string} book.title - Book title
 * @param {string} book.author - Book author
 * @returns {Promise<any>} Firestore document reference
 */
export async function addBookToShelf(shelf, book) {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("User not logged in");
    }

    const shelfRef = db.collection(`users/${user.uid}/${shelf}`);

    return shelfRef.add({
        title: book.title,
        author: book.author,
        addedAt: new Date()
    });
}
