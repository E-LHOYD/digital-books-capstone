import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore';
import { Auth } from '@nativescript/firebase-auth';

// Records that the signed-in user was here.
//
// Without this the admin dashboard has no way to tell who is active: it was
// showing totalUsers * 0.3 as a stand-in. A timestamp on the user document is
// the smallest thing that makes the figure real.

let authInstance = null;

function getAuth() {
    if (!authInstance) {
        authInstance = new Auth();
    }
    return authInstance;
}

// Writing on every screen would be wasteful; once every few minutes is enough
// to drive an "active now" window.
const MIN_INTERVAL_MS = 5 * 60 * 1000;
let lastWriteAt = 0;

/**
 * Stamp users/{uid}.lastSeenAt with the current time.
 * Failures are logged and swallowed: presence is never worth interrupting the
 * reader for.
 * @param {boolean} force - write even if one happened recently
 * @returns {Promise<boolean>}
 */
export async function recordActivity(force = false) {
    try {
        const user = getAuth().currentUser;
        if (!user) return false;

        const now = Date.now();
        if (!force && now - lastWriteAt < MIN_INTERVAL_MS) return false;
        lastWriteAt = now;

        await firebase()
            .firestore()
            .collection('users')
            .doc(user.uid)
            .set({ lastSeenAt: new Date() }, { merge: true });

        return true;
    } catch (error) {
        console.error('Could not record activity:', error);
        return false;
    }
}
