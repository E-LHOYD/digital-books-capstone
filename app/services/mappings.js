// Fetch dynamic program and department to subject mappings from Firestore
//
// These mappings allow admins to configure which subjects are associated with
// student programs (strands/courses) and teacher departments, which then drives
// the recommendation system.

import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-firestore';

// Cache for mappings to avoid repeated Firestore queries
let programMappingsCache = null;
let departmentMappingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch program mappings from Firestore
 * @returns {Promise<Object>} Object mapping program names to subject arrays
 */
export async function fetchProgramMappings() {
    try {
        // Check cache
        const now = Date.now();
        if (programMappingsCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
            return programMappingsCache;
        }

        const snapshot = await firebase()
            .firestore()
            .collection('programMappings')
            .get();

        const mappings = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.name && data.subjects) {
                mappings[data.name.trim().toUpperCase()] = data.subjects;
            }
        });

        // Update cache
        programMappingsCache = mappings;
        cacheTimestamp = now;

        return mappings;
    } catch (error) {
        console.error('Error fetching program mappings:', error);
        return {};
    }
}

/**
 * Fetch department mappings from Firestore
 * @returns {Promise<Object>} Object mapping department names to subject arrays
 */
export async function fetchDepartmentMappings() {
    try {
        // Check cache
        const now = Date.now();
        if (departmentMappingsCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
            return departmentMappingsCache;
        }

        const snapshot = await firebase()
            .firestore()
            .collection('departmentMappings')
            .get();

        const mappings = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.department && data.subjects) {
                mappings[data.department.trim().toUpperCase()] = data.subjects;
            }
        });

        // Update cache
        departmentMappingsCache = mappings;
        cacheTimestamp = now;

        return mappings;
    } catch (error) {
        console.error('Error fetching department mappings:', error);
        return {};
    }
}

/**
 * Get subjects for a student's program (strand or course) from dynamic mappings
 * Falls back to default TRACK_SUBJECTS if no mapping found
 * @param {string} track - The student's strand or course
 * @returns {Promise<string[]>} Array of subject names
 */
export async function getSubjectsForProgram(track) {
    if (typeof track !== 'string' || !track.trim()) return [];

    const text = track.trim().toUpperCase();
    const mappings = await fetchProgramMappings();

    // Try exact match first
    if (mappings[text]) {
        return mappings[text];
    }

    // Try partial match
    for (const [key, subjects] of Object.entries(mappings)) {
        if (text.includes(key) || key.includes(text)) {
            return subjects;
        }
    }

    // Return empty array if no mapping found
    // The calling code should handle the fallback to default mappings
    return [];
}

/**
 * Get subjects for a teacher's department from dynamic mappings
 * @param {string} department - The teacher's department
 * @returns {Promise<string[]>} Array of subject names
 */
export async function getSubjectsForDepartment(department) {
    if (typeof department !== 'string' || !department.trim()) return [];

    const text = department.trim().toUpperCase();
    const mappings = await fetchDepartmentMappings();

    // Try exact match first
    if (mappings[text]) {
        return mappings[text];
    }

    // Try partial match
    for (const [key, subjects] of Object.entries(mappings)) {
        if (text.includes(key) || key.includes(text)) {
            return subjects;
        }
    }

    return [];
}

/**
 * Clear the mapping cache (useful after admin updates)
 */
export function clearMappingCache() {
    programMappingsCache = null;
    departmentMappingsCache = null;
    cacheTimestamp = null;
}
