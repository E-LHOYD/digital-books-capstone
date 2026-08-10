// Book file service for the mobile app.
//
// Book files live in Supabase Storage. Firestore stores only the public URL,
// in the `fileUrl` field of each document in the `books` collection. The admin
// dashboard uploads the file and writes that field.
//
// The app opens books through the dashboard's /reader page rather than loading
// the PDF URL directly, because Android's WebView has no built-in PDF viewer
// and shows nothing at all when handed a PDF URL. The reader page draws the
// pages with pdf.js.

// Use the deployed admin dashboard URL
const API_BASE_URL = 'https://admin-dashboard-xi-nine-5gm5r8ufpa.vercel.app';

/**
 * True if the value looks like a usable book file URL.
 * @param {string} url
 * @returns {boolean}
 */
export function isBookFileUrl(url) {
    if (typeof url !== 'string') return false;
    return /^https:\/\/[^\s]+$/i.test(url.trim());
}

/**
 * URL of the reader page for a book, to be loaded in a WebView.
 * @param {string} fileUrl - The storage URL stored in Firestore
 * @returns {string}
 */
export function getReaderUrl(fileUrl) {
    return `${API_BASE_URL}/reader?url=${encodeURIComponent(fileUrl)}`;
}
