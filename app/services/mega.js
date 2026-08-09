// MEGA book service for the mobile app.
//
// Books live in MEGA cloud storage. Firestore stores only the share link, in
// the `megaFileUrl` field of each document in the `books` collection.
//
// A MEGA share link cannot be opened directly by the app: MEGA encrypts files
// and decrypts them in the browser, so the link points at a web page rather
// than at PDF bytes. The admin dashboard does the decryption server-side and
// exposes two endpoints:
//
//   GET /api/mega/file?url=<mega link>   -> the raw decrypted PDF bytes
//   GET /reader?url=<mega link>          -> an HTML page that renders those
//                                           bytes with pdf.js
//
// The app loads /reader in a WebView. It has to be the reader page rather than
// the raw PDF because Android's WebView has no built-in PDF viewer and shows
// nothing at all when handed a PDF URL.

// Use the deployed admin dashboard URL
const API_BASE_URL = 'https://admin-dashboard-xi-nine-5gm5r8ufpa.vercel.app';

// New-style link:  https://mega.nz/file/<handle>#<key>
// Legacy link:     https://mega.nz/#!<handle>!<key>
const NEW_STYLE = /^https?:\/\/mega\.(nz|co\.nz)\/file\/[^#/\s]+#[^\s]+$/i;
const LEGACY_STYLE = /^https?:\/\/mega\.(nz|co\.nz)\/#![^!\s]+![^\s]+$/i;

/**
 * True if the value is a MEGA file link that still carries its decryption key.
 * @param {string} url
 * @returns {boolean}
 */
export function isMegaUrl(url) {
    if (typeof url !== 'string') return false;
    const trimmed = url.trim();
    return NEW_STYLE.test(trimmed) || LEGACY_STYLE.test(trimmed);
}

/**
 * URL of the reader page for a book, to be loaded in a WebView.
 * @param {string} megaFileUrl - The MEGA share link stored in Firestore
 * @returns {string}
 */
export function getReaderUrl(megaFileUrl) {
    return `${API_BASE_URL}/reader?url=${encodeURIComponent(megaFileUrl)}`;
}

/**
 * URL of the raw decrypted file. Useful for downloading or for handing off to
 * an external viewer; the in-app reader uses getReaderUrl instead.
 * @param {string} megaFileUrl - The MEGA share link stored in Firestore
 * @returns {string}
 */
export function getBookFileUrl(megaFileUrl) {
    return `${API_BASE_URL}/api/mega/file?url=${encodeURIComponent(megaFileUrl)}`;
}
