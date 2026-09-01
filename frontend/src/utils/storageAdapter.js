/**
 * Exception-safe storage adapter for localStorage.
 * Handles cases where Web Storage may throw exceptions
 * (quota exceeded, private mode, etc.).
 */

const storageAdapter = {
    /**
     * Safely get an item from localStorage.
     * @param {string} key - The storage key
     * @returns {string | null} The stored value or null if not found or error occurs
     */
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    },

    /**
     * Safely set an item in localStorage.
     * @param {string} key - The storage key
     * @param {string} value - The value to store
     * @returns {boolean} True if successful, false otherwise
     */
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Safely remove an item from localStorage.
     * @param {string} key - The storage key
     * @returns {boolean} True if successful, false otherwise
     */
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    },
};

export default storageAdapter;
