/**
 * Order Status Utility for Frontend
 * Provides consistent order status handling in the miniprogram
 * Requirements: 1.5 - Consistent status codes (0=pending, 1=verified, 2=cancelled)
 */

// Order status constants - must match backend
const ORDER_STATUS = {
    PENDING: 0,     // 待核实 - pending verification
    VERIFIED: 1,    // 已核实 - verified
    CANCELLED: 2    // 已取消 - cancelled
};

// Status display mapping for Chinese UI
const STATUS_DISPLAY = {
    [ORDER_STATUS.PENDING]: '待核实',
    [ORDER_STATUS.VERIFIED]: '已核实',
    [ORDER_STATUS.CANCELLED]: '已取消'
};

// Status mapping for internal frontend use
const STATUS_MAPPING = {
    [ORDER_STATUS.PENDING]: 'pending_verify',
    [ORDER_STATUS.VERIFIED]: 'verified',
    [ORDER_STATUS.CANCELLED]: 'cancelled'
};

// Reverse mapping from frontend strings to status codes
const REVERSE_STATUS_MAPPING = {
    'pending_verify': ORDER_STATUS.PENDING,
    'verified': ORDER_STATUS.VERIFIED,
    'cancelled': ORDER_STATUS.CANCELLED
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
 */
function getStatusDisplayText(status) {
    if (!isValidOrderStatus(status)) {
        return `无效状态(${status})`;
    }
    return STATUS_DISPLAY[status];
}

/**
 * Get status mapping for frontend
 * @param {number} status - Status value
 * @returns {string} - Frontend status string
 */
function getStatusMapping(status) {
    if (!isValidOrderStatus(status)) {
        return 'unknown';
    }
    return STATUS_MAPPING[status];
}

/**
 * Get status code from frontend string
 * @param {string} statusString - Frontend status string
 * @returns {number|null} - Status code or null if invalid
 */
function getStatusFromMapping(statusString) {
    return REVERSE_STATUS_MAPPING[statusString] || null;
}

/**
 * Map database order to frontend format
 * @param {Object} order - Order object from database
 * @returns {Object} - Order object with mapped status
 */
function mapOrderStatus(order) {
    if (!order || typeof order.status === 'undefined') {
        return order;
    }

    return {
        ...order,
        status: getStatusMapping(order.status),
        statusText: getStatusDisplayText(order.status),
        originalStatus: order.status // Keep original for debugging
    };
}

/**
 * Check if order can be verified
 * @param {Object} order - Order object
 * @returns {boolean} - True if order can be verified
 */
function canVerifyOrder(order) {
    if (!order) return false;

    // Check both mapped status and original status
    const status = order.originalStatus !== undefined ? order.originalStatus : getStatusFromMapping(order.status);
    return status === ORDER_STATUS.PENDING && !order.verifying;
}

/**
 * Check if order is in pending state
 * @param {Object} order - Order object
 * @returns {boolean} - True if order is pending
 */
function isOrderPending(order) {
    if (!order) return false;

    const status = order.originalStatus !== undefined ? order.originalStatus : getStatusFromMapping(order.status);
    return status === ORDER_STATUS.PENDING;
}

/**
 * Check if order is verified
 * @param {Object} order - Order object
 * @returns {boolean} - True if order is verified
 */
function isOrderVerified(order) {
    if (!order) return false;

    const status = order.originalStatus !== undefined ? order.originalStatus : getStatusFromMapping(order.status);
    return status === ORDER_STATUS.VERIFIED;
}

/**
 * Check if order is cancelled
 * @param {Object} order - Order object
 * @returns {boolean} - True if order is cancelled
 */
function isOrderCancelled(order) {
    if (!order) return false;

    const status = order.originalStatus !== undefined ? order.originalStatus : getStatusFromMapping(order.status);
    return status === ORDER_STATUS.CANCELLED;
}

/**
 * Get all valid status values
 * @returns {number[]} - Array of valid status values
 */
function getValidStatusValues() {
    return Object.values(ORDER_STATUS);
}

/**
 * Validate order list and log any inconsistencies
 * @param {Array} orders - Array of order objects
 * @returns {Array} - Array of validated orders
 */
function validateOrderList(orders) {
    if (!Array.isArray(orders)) {
        return [];
    }

    return orders.map((order, index) => {
        if (!order) {
            return order;
        }

        if (typeof order.status === 'undefined') {
            return order;
        }

        // If status is already a string (mapped), validate it
        if (typeof order.status === 'string') {
            const statusCode = getStatusFromMapping(order.status);
            if (statusCode === null) {
            }
            return order;
        }

        // If status is a number, validate it
        if (typeof order.status === 'number') {
            if (!isValidOrderStatus(order.status)) {
            }
            return mapOrderStatus(order);
        }

        return order;
    });
}

module.exports = {
    ORDER_STATUS,
    STATUS_DISPLAY,
    STATUS_MAPPING,
    REVERSE_STATUS_MAPPING,
    isValidOrderStatus,
    getStatusDisplayText,
    getStatusMapping,
    getStatusFromMapping,
    mapOrderStatus,
    canVerifyOrder,
    isOrderPending,
    isOrderVerified,
    isOrderCancelled,
    getValidStatusValues,
    validateOrderList
};