// 🔥 Firebase Core
import { firebase } from '@nativescript/firebase-core';

// �� Auth
import { Auth } from '@nativescript/firebase-auth';

// 💾 Firestore
import { Firestore } from '@nativescript/firebase-firestore';

// 🔧 Application Settings for persistent login
import {
    getString,
    setString,
    getBoolean,
    setBoolean,
    remove
} from '@nativescript/core/application-settings';

// Initialize Firebase (ONLY ONCE)
// Firebase is initialized automatically by the plugin

// Export initFirebase function for external use
export function initFirebase() {
    // Firebase is initialized automatically by the plugin
}

const auth = new Auth();
const db = new Firestore();

// Storage keys for persistent login
const STORAGE_KEYS = {
    EMAIL: 'user_email',
    PASSWORD: 'user_password',
    KEEP_LOGGED_IN: 'keep_logged_in'
};

// Save user credentials for persistent login
export function saveCredentials(email, password, keepLoggedIn) {
    try {
        console.log("Saving credentials, keepLoggedIn:", keepLoggedIn);
        if (keepLoggedIn) {
            setString(STORAGE_KEYS.EMAIL, email);
            setString(STORAGE_KEYS.PASSWORD, password);
            setBoolean(STORAGE_KEYS.KEEP_LOGGED_IN, true);
            console.log("Credentials saved successfully");
        } else {
            clearCredentials();
        }
    } catch (error) {
        console.error("Error saving credentials:", error);
    }
}

// Get saved credentials
export function getSavedCredentials() {
    const keepLoggedIn = getBoolean(STORAGE_KEYS.KEEP_LOGGED_IN, false);
    if (keepLoggedIn) {
        return {
            email: getString(STORAGE_KEYS.EMAIL, ''),
            password: getString(STORAGE_KEYS.PASSWORD, '')
        };
    }
    return null;
}

// Clear saved credentials
export function clearCredentials() {
    remove(STORAGE_KEYS.EMAIL);
    remove(STORAGE_KEYS.PASSWORD);
    remove(STORAGE_KEYS.KEEP_LOGGED_IN);
}


// =========================
// 🔐 LOGIN USER
// =========================
/**
 * Login user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {boolean} keepLoggedIn - Whether to keep user logged in
 * @returns {Promise<any>} User credential object
 */
export async function login(email, password, keepLoggedIn = true) {
    try {
        console.log("Attempting login with:", email);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log("Login successful, userCredential:", userCredential);
        
        const user = userCredential.user || userCredential;
        console.log("User object:", user);
        
        // Save credentials if user wants to stay logged in
        saveCredentials(email, password, keepLoggedIn);
        
        return user;
    } catch (error) {
        console.error("Login error:", error);
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
// 🔐 LOGOUT USER
// =========================
/**
 * Logout user and clear credentials
 * @returns {Promise<void>}
 */
export async function logout() {
    try {
        await auth.signOut();
        clearCredentials();
    } catch (error) {
        throw error;
    }
}

// =========================
// 🔐 AUTO LOGIN
// =========================
/**
 * Attempt to auto-login using saved credentials
 * @returns {Promise<any>} User credential object or null
 */
export async function autoLogin() {
    try {
        const credentials = getSavedCredentials();
        if (credentials && credentials.email && credentials.password) {
            console.log("Attempting auto-login with saved credentials");
            const user = await login(credentials.email, credentials.password, true);
            return user;
        }
        return null;
    } catch (error) {
        console.error("Auto-login failed:", error);
        clearCredentials(); // Clear invalid credentials
        return null;
    }
}

// =========================
// 👤 GET CURRENT USER
// =========================
/**
 * Get the currently authenticated user
 * @returns {Promise<any>} Current user object or null
 */
export async function getCurrentUser() {
    try {
        // In NativeScript Firebase Auth, current user is accessed via a property
        const user = auth.currentUser;
        return user;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

// =========================
// 👤 GET USER PROFILE
// =========================
/**
 * Get user profile data from Firestore
 * @param {string} uid - User's Firebase UID
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error("Error getting user profile:", error);
        return null;
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
        console.log("Looking up user by username:", username);
        const usersRef = db.collection('users');
        const query = await usersRef.where('username', '==', username).get();
        
        console.log("Query results:", query.docs.length, "documents found");
        
        if (query.empty) {
            console.log("No user found with username:", username);
            throw new Error('User not found with this username');
        }
        
        const userDoc = query.docs[0];
        const userData = userDoc.data();
        console.log("User data from Firestore:", userData);
        
        if (!userData.email) {
            console.error("User data missing email field:", userData);
            throw new Error('User profile missing email address');
        }
        
        return userData;
    } catch (error) {
        console.error("Error in getUserByUsername:", error);
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

// =========================
// // CREATE USER PROFILE
// =========================
/**
 * Create user profile in Firestore after registration
 * @param {Object} userData - User profile data
 * @returns {Promise<any>} Firestore document reference
 */
export async function createUserProfile(userData) {
    try {
        const user = auth.currentUser;
        
        if (!user) {
            throw new Error("User not authenticated");
        }

        const userProfile = {
            uid: user.uid,
            email: user.email || userData.email, // Use Firebase Auth email first, fallback to provided email
            username: userData.username,
            role: userData.role,
            firstName: userData.firstName,
            middleName: userData.middleName || '',
            lastName: userData.lastName,
            surname: userData.lastName, // Add surname field for admin dashboard compatibility
            interests: userData.interests,
            createdAt: new Date(), // Use client-side timestamp (Firebase will handle it correctly)
            ...(userData.role === 'student' && {
                studentType: userData.studentType,
                ...(userData.studentType === 'senior-high' && {
                    lrn: userData.lrn,
                    strand: userData.strand,
                    grade: userData.grade
                }),
                ...(userData.studentType === 'college' && {
                    studentNumber: userData.studentNumber,
                    course: userData.course,
                    year: userData.year
                })
            })
        };

        const userRef = db.collection('users').doc(user.uid);
        await userRef.set(userProfile);
        
        console.log("User profile created successfully:", userProfile);
        return userProfile;
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error;
    }
}
