// The year levels a book can be aimed at, and the matching a student's profile
// is put through to decide whether a book is recommended to them.
//
// This list mirrors src/lib/yearLevels.js in the admin dashboard. Both sides
// must agree, or the app filters on levels the dashboard never writes.
//
// The stored strings deliberately match the values already held on user
// documents (`grade` for senior high, `year` for college), so a book's level
// can be compared to a student's level without a translation table in between.

export const SENIOR_HIGH_LEVELS = ['Grade 11', 'Grade 12'];

export const COLLEGE_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

export const YEAR_LEVELS = [...SENIOR_HIGH_LEVELS, ...COLLEGE_LEVELS];

const CANONICAL = new Map(YEAR_LEVELS.map((level) => [level.toLowerCase(), level]));

const ORDINALS = [
    ['1st', '1'],
    ['2nd', '2'],
    ['3rd', '3'],
    ['4th', '4'],
    ['5th', '5']
];

/**
 * Turn whatever a student typed at signup into one of the canonical levels.
 *
 * Signup collects grade and year as free text, so the same level arrives as
 * "Grade 11", "grade11", "11", "1st Year", "1st", "Year 1" and so on. Without
 * this every one of those looks like a different level and a student matches
 * nothing.
 *
 * @param {any} raw
 * @returns {string} A canonical level, or '' if it could not be read.
 */
export function normalizeLevel(raw) {
    if (typeof raw !== 'string') return '';

    const text = raw.trim().toLowerCase();
    if (!text) return '';

    const exact = CANONICAL.get(text);
    if (exact) return exact;

    const gradeMatch = text.match(/(?:grade\s*)?(\d{1,2})/);

    if (text.includes('grade') && gradeMatch) {
        const n = Number(gradeMatch[1]);
        if (n === 11 || n === 12) return `Grade ${n}`;
    }

    for (const [ordinal, digit] of ORDINALS) {
        if (text.includes(ordinal) || text.includes(`year ${digit}`) || text === digit) {
            return `${ordinal} Year`;
        }
    }

    // A bare 11 or 12 with no other clue is far more likely a senior high grade
    // than a college year, which only runs to 5.
    if (gradeMatch) {
        const n = Number(gradeMatch[1]);
        if (n === 11 || n === 12) return `Grade ${n}`;
    }

    return '';
}

/**
 * The year levels a book is aimed at.
 * @param {any} book
 * @returns {string[]}
 */
export function bookYearLevels(book) {
    if (!Array.isArray(book?.yearLevels)) return [];
    return book.yearLevels
        .map((level) => normalizeLevel(level))
        .filter(Boolean)
        .filter((level, i, all) => all.indexOf(level) === i)
        .sort((a, b) => YEAR_LEVELS.indexOf(a) - YEAR_LEVELS.indexOf(b));
}

/**
 * The canonical level of a student, read from whichever field their signup
 * filled in.
 * @param {any} user
 * @returns {string}
 */
export function studentLevel(user) {
    return (
        normalizeLevel(user?.grade) ||
        normalizeLevel(user?.year) ||
        normalizeLevel(user?.yearLevel)
    );
}

/**
 * True if the book suits this student's year level.
 *
 * A book with no level set suits everyone: most of the library was uploaded
 * before books carried a level, and silently hiding all of it would be worse
 * than recommending a little too broadly. The same applies in reverse when a
 * student's own level cannot be read.
 *
 * @param {any} book
 * @param {any} user
 * @returns {boolean}
 */
export function matchesYearLevel(book, user) {
    const levels = bookYearLevels(book);
    if (levels.length === 0) return true;

    const level = studentLevel(user);
    if (!level) return true;

    return levels.includes(level);
}

/** True if the student is in senior high rather than college. */
export function isSeniorHigh(user) {
    return SENIOR_HIGH_LEVELS.includes(studentLevel(user));
}
