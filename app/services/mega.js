// MEGA Streaming Service for Mobile App
// This service handles streaming books from MEGA cloud storage for reading

// Use the deployed admin dashboard URL (update this after deployment)
const API_BASE_URL = 'https://gardnerebooks-admin.vercel.app'; // Update with your actual Vercel URL

/**
 * Get a readable stream from MEGA URL for direct reading
 * @param {string} megaUrl - The MEGA file URL
 * @returns {Promise<string>} Stream URL that can be used for reading
 */
export async function getMegaStreamUrl(megaUrl) {
    try {
        console.log("Getting stream URL from MEGA:", megaUrl);
        console.log("API URL:", `${API_BASE_URL}/api/mega/stream`);
        
        // Use the admin dashboard API to get a stream URL from MEGA
        const response = await fetch(`${API_BASE_URL}/api/mega/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fileUrl: megaUrl })
        });

        console.log("Response status:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error response:", errorText);
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        console.log("Stream URL obtained:", result.streamUrl);
        return result.streamUrl;

    } catch (error) {
        console.error("MEGA stream error:", error);
        console.error("Error details:", error.message);
        throw error;
    }
}

/**
 * Get direct MEGA URL for reading (fallback if streaming API is not available)
 * @param {string} megaUrl - The MEGA file URL
 * @returns {string} Direct MEGA URL
 */
export function getDirectMegaUrl(megaUrl) {
    console.log("Using direct MEGA URL for reading:", megaUrl);
    return megaUrl;
}