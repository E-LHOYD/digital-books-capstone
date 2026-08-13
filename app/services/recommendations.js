// Picking which books to put in front of a student.
//
// The old version scanned each book's title and description for words like
// "advanced", "bscs" or "math". That guessed at data the dashboard already
// records properly, and it dropped any book whose text happened not to mention
// the right word. This works from the fields books actually carry: the year
// levels the book is aimed at, and its subjects.

import { bookSubjects } from './subjects';
import { matchesYearLevel, studentLevel } from './yearLevels';

// Which subjects each strand or course leans on. Only the canonical subject
// labels appear here, so every entry can actually match a book.
const TRACK_SUBJECTS = {
    // Senior high strands
    STEM: ['Math', 'Science', 'Computer', 'English'],
    ABM: ['Business', 'Math', 'English'],
    HUMSS: ['Literature', 'English', 'Filipino', 'Arts'],
    GAS: ['English', 'Filipino', 'Math', 'Science', 'Literature'],
    TVL: ['Computer', 'Business', 'Health'],
    SPORTS: ['Physical Education', 'Health', 'Science'],
    'ARTS & DESIGN': ['Arts', 'Music', 'Literature'],

    // College courses
    BSCS: ['Computer', 'Math', 'English'],
    BSIT: ['Computer', 'Math', 'English'],
    BSIS: ['Computer', 'Business', 'Math'],
    BSBA: ['Business', 'Math', 'English']
};

/**
 * The student's strand or course, whichever their signup filled in.
 * @param {any} user
 * @returns {string}
 */
export function studentTrack(user) {
    const raw = user?.strand || user?.course || '';
    return typeof raw === 'string' ? raw.trim() : '';
}

/**
 * The subjects a track leans on, or an empty list if the track is unknown.
 *
 * Matching is loose on purpose: signup takes the strand and course as free
 * text, so "bscs", "BS Computer Science" and "BSCS " all have to land on the
 * same entry.
 *
 * @param {string} track
 * @returns {string[]}
 */
export function subjectsForTrack(track) {
    if (typeof track !== 'string' || !track.trim()) return [];

    const text = track.trim().toUpperCase();

    if (TRACK_SUBJECTS[text]) return TRACK_SUBJECTS[text];

    for (const [key, subjects] of Object.entries(TRACK_SUBJECTS)) {
        if (text.includes(key)) return subjects;
    }

    // A few spelled-out forms that carry no course code.
    if (text.includes('COMPUTER') || text.includes('INFORMATION TECH')) return TRACK_SUBJECTS.BSCS;
    if (text.includes('BUSINESS') || text.includes('ACCOUNT')) return TRACK_SUBJECTS.BSBA;
    if (text.includes('ARTS') || text.includes('DESIGN')) return TRACK_SUBJECTS['ARTS & DESIGN'];
    if (text.includes('SPORT')) return TRACK_SUBJECTS.SPORTS;

    return [];
}

/**
 * How well a book suits a student, as a count of the subjects they share.
 * @param {any} book
 * @param {string[]} preferred
 * @returns {number}
 */
function scoreBook(book, preferred) {
    if (preferred.length === 0) return 0;
    const subjects = bookSubjects(book);
    return subjects.filter((subject) => preferred.includes(subject)).length;
}

/**
 * Books to recommend to a student, best first.
 *
 * Year level is a filter: a book aimed at Grade 11 is not offered to a college
 * student. Subject is a ranking, not a filter, so a student whose strand has no
 * matching books still gets the rest of the library rather than an empty page.
 *
 * Now also uses the student's manually selected interests from their profile.
 *
 * @param {any[]} books
 * @param {any} user
 * @param {number} [limit]
 * @returns {any[]}
 */
export function recommendBooks(books, user, limit = 20) {
    if (!Array.isArray(books)) return [];

    const trackSubjects = subjectsForTrack(studentTrack(user));
    const userInterests = Array.isArray(user?.interests) ? user.interests : [];

    // Combine strand/course subjects with user's selected interests
    // Remove duplicates while preserving order
    const preferred = [...new Set([...trackSubjects, ...userInterests])];

    return books
        .filter((book) => book && book.title)
        .filter((book) => matchesYearLevel(book, user))
        .map((book) => ({ book, score: scoreBook(book, preferred) }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return String(a.book.title).localeCompare(String(b.book.title));
        })
        .slice(0, limit)
        .map((entry) => entry.book);
}

/**
 * A short line describing why these books were chosen, shown above the list so
 * the page is not a black box.
 * @param {any} user
 * @returns {string}
 */
export function recommendationReason(user) {
    const level = studentLevel(user);
    const track = studentTrack(user);
    const trackSubjects = subjectsForTrack(track);
    const userInterests = Array.isArray(user?.interests) ? user.interests : [];

    if (!level && trackSubjects.length === 0 && userInterests.length === 0) {
        return 'Showing the whole library. Add your year level, strand or course, and interests to get a shorter list.';
    }

    const parts = [];
    if (level) parts.push(`for ${level}`);
    
    const preferred = [...new Set([...trackSubjects, ...userInterests])];
    if (preferred.length > 0) parts.push(`leaning on ${preferred.join(', ')}`);

    return `Books ${parts.join(', ')}.`;
}
