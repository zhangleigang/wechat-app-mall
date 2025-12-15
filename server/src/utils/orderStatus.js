/**
 * Order Status Validation Utility
 * Provides consistent order status handling across the system
 * Requirements: 1.5 - Consistent status codes (0=pending, 1=verified, 2=cancelled)
 */

// Order status constants for consistency
const ORDER_STATUS = {
    PENDING: 0,     // 待核实 - pending verification
    VERIFIED: 1,    // 已核实 - verified
    CANCELLED: 2    // 已取消 - cancelled
};

// Status display mapping for consistency
const STATUS_DISPLAY = {
    [ORDER_STATUS.PENDING]: '待核实',
    [ORDER_STATUS.VERIFIED]: '已核实',
    [ORDER_STATUS.CANCELLED]: '已取消'
};

// English status mapping for frontend
const STATUS_MAPPING = {
    [ORDER_STATUS.PENDING]: 'pending_verify',
    [ORDER_STATUS.VERIFIED]: 'verified',
    [ORDER_STATUS.CANCELLED]: 'cancelled'
};

/**
 * Validate order status value
 * @param {number} status - Status value to validate
 * @returns {boolean} - True if valid status
 */
function isValidOrderStatus(status) {
    return typeof status === 'number' &&
        Number.isInteger(status) &&
        Object.values(ORDER_STATUS).includes(status);
}

/**
 * Get status display text in Chinese
 * @param {number} status - Status value
 * @returns {string} - Display text for status
 * @throws {Error} - If status is invalid
 */
function getStatusDisplayText(status) {
    if (!isValidOrderStatus(status)) {
        throw new Error(`Invalid order status: ${status}`);
    }
    return STATUS_DISPLAY[status];
}

/**
 * Get status mapping for frontend
 * @param {number} status - Status value
 * @returns {string} - Frontend status string
 * @throws {Error} - If status is invalid
 */
function getStatusMapping(status) {
    if (!isValidOrderStatus(status)) {
        throw new Error(`Invalid order status: ${status}`);
    }
    return STATUS_MAPPING[status];
}

/**
 * Validate and sanitize status input
 * @param {any} input - Input status value
 * @returns {number} - Validated status value
 * @throws {Error} - If status is invalid
 */
function validateAndSanitizeStatus(input) {
    // Handle null, undefined, empty string
    if (input === null || input === undefined || input === '') {
        throw new Error('Status cannot be null, undefined, or empty');
    }

    // Convert to number if it's a string
    const status = typeof input === 'string' ? parseInt(input, 10) : input;

    // Check for NaN
    if (isNaN(status)) {
        throw new Error(`Invalid order status: ${input}. Must be a valid number`);
    }

    if (!isValidOrderStatus(status)) {
        throw new Error(`Invalid order status: ${input}. Must be one of: ${Object.values(ORDER_STATUS).join(', ')}`);
    }

    return status;
}

/**
 * Get all valid status values
 * @returns {number[]} - Array of valid status values
 */
function getValidStatusValues() {
    return Object.values(ORDER_STATUS);
}

/**
 * Get status transitions that are allowed
 * @param {number} currentStatus - Current status
 * @returns {number[]} - Array of allowed next status values
 */
function getAllowedStatusTransitions(currentStatus) {
    if (!isValidOrderStatus(currentStatus)) {
        throw new Error(`Invalid current status: ${currentStatus}`);
    }

    switch (currentStatus) {
        case ORDER_STATUS.PENDING:
            // Pending orders can be verified or cancelled
            return [ORDER_STATUS.VERIFIED, ORDER_STATUS.CANCELLED];
        case ORDER_STATUS.VERIFIED:
            // Verified orders can only be cancelled (if needed)
            return [ORDER_STATUS.CANCELLED];
        case ORDER_STATUS.CANCELLED:
            // Cancelled orders cannot transition to other states
            return [];
        default:
            return [];
    }
}

/**
 * Check if status transition is allowed
 * @param {number} fromStatus - Current status
 * @param {number} toStatus - Target status
 * @returns {boolean} - True if transition is allowed
 */
function isStatusTransitionAllowed(fromStatus, toStatus) {
    if (!isValidOrderStatus(fromStatus) || !isValidOrderStatus(toStatus)) {
        return false;
    }

    const allowedTransitions = getAllowedStatusTransitions(fromStatus);
    return allowedTransitions.includes(toStatus);
}

/**
 * Validate database constraint for status column
 * This function can be used to add CHECK constraints to the database
 * @returns {string} - SQL CHECK constraint
 */
function getDatabaseStatusConstraint() {
    const validValues = getValidStatusValues().join(', ');
    return `CHECK (status IN (${validValues}))`;
}

module.exports = {
    ORDER_STATUS,
    STATUS_DISPLAY,
    STATUS_MAPPING,
    isValidOrderStatus,
    getStatusDisplayText,
    getStatusMapping,
    validateAndSanitizeStatus,
    getValidStatusValues,
    getAllowedStatusTransitions,
    isStatusTransitionAllowed,
    getDatabaseStatusConstraint
};