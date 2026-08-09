// App Update Service for Over-the-Air Updates
// Currently disabled - download site was removed
// This service can be re-enabled when a download solution is determined

const UPDATE_API_URL = 'https://admin-dashboard-xi-nine-5gm5r8ufpa.vercel.app/api/app-version';

// Current app version (should match app configuration)
const CURRENT_VERSION = '1.0.1';
const CURRENT_VERSION_CODE = 2;

/**
 * Check for app updates from the server
 * @returns {Promise<Object|null>} Update information or null if no update available
 */
export async function checkForUpdates() {
    try {
        console.log("Checking for app updates...");
        
        const response = await fetch(UPDATE_API_URL);
        
        if (!response.ok) {
            console.error("Failed to check for updates:", response.status);
            return null;
        }
        
        const updateInfo = await response.json();
        console.log("Update info received:", updateInfo);
        
        // Check if update is needed
        if (isUpdateAvailable(updateInfo)) {
            console.log("Update available:", updateInfo.version);
            return updateInfo;
        }
        
        console.log("No update available");
        return null;
    } catch (error) {
        console.error("Error checking for updates:", error);
        return null;
    }
}

/**
 * Check if an update is available based on version comparison
 * @param {Object} updateInfo - Update information from server
 * @returns {boolean} Whether an update is available
 */
function isUpdateAvailable(updateInfo) {
    // Check version code (more reliable than version string)
    if (updateInfo.versionCode > CURRENT_VERSION_CODE) {
        return true;
    }
    
    // Also check version string as fallback
    if (updateInfo.version !== CURRENT_VERSION) {
        return true;
    }
    
    return false;
}

/**
 * Check if the update is forced (user must update to continue)
 * @param {Object} updateInfo - Update information from server
 * @returns {boolean} Whether the update is forced
 */
export function isForcedUpdate(updateInfo) {
    return updateInfo.forceUpdate === true;
}

/**
 * Check if current version meets minimum requirement
 * @param {Object} updateInfo - Update information from server
 * @returns {boolean} Whether current version is supported
 */
export function isCurrentVersionSupported(updateInfo) {
    if (!updateInfo.minVersion) {
        return true;
    }
    
    // Simple version comparison (1.0.0 format)
    const currentParts = CURRENT_VERSION.split('.').map(Number);
    const minParts = updateInfo.minVersion.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, minParts.length); i++) {
        const current = currentParts[i] || 0;
        const min = minParts[i] || 0;
        
        if (current > min) return true;
        if (current < min) return false;
    }
    
    return true;
}

/**
 * Get the download URL for the latest APK
 * @param {Object} updateInfo - Update information from server
 * @returns {string} Download URL
 */
export function getDownloadUrl(updateInfo) {
    return updateInfo.downloadUrl;
}

/**
 * Get the changelog for the update
 * @param {Object} updateInfo - Update information from server
 * @returns {Array<string>} List of changes
 */
export function getChangelog(updateInfo) {
    return updateInfo.changes || [];
}