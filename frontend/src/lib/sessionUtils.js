/**
 * Academic Session Utilities
 * Automatically calculates current academic session based on date
 * Session changes every May (new academic year starts in September but admission opens in May)
 */

/**
 * Get current academic session string (e.g., "2025/2026")
 * Changes to next session after May 1st each year
 * @returns {string} Current session in "YYYY/YYYY" format
 */
export const getCurrentSession = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed (January = 0, May = 4)

    // If we're in May (month 4) or later, use current year as start year
    // Otherwise, use previous year as start year
    if (month >= 4) { // May onwards
        return `${year}/${year + 1}`;
    }
    return `${year - 1}/${year}`;
};

/**
 * Get next academic session (for admission planning)
 * @returns {string} Next session in "YYYY/YYYY" format
 */
export const getNextSession = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (month >= 4) { // May onwards
        return `${year + 1}/${year + 2}`;
    }
    return `${year}/${year + 1}`;
};

/**
 * Get admission status based on current date
 * Admissions typically open in May and close in August
 * @returns {boolean} Whether admissions are currently open
 */
export const isAdmissionOpen = () => {
    const month = new Date().getMonth();
    // Admissions open from May (4) to August (7)
    return month >= 4 && month <= 7;
};

/**
 * Get the start year of current session
 * @returns {number}
 */
export const getSessionStartYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (month >= 4) {
        return year;
    }
    return year - 1;
};
