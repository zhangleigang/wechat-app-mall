# Requirements Document

## Introduction

The admin orders management system is showing incorrect order status data. New orders are appearing as "已核实" (verified) status in the backend when they should default to "待核实" (pending verification) status. This prevents administrators from properly managing the payment verification workflow.

## Glossary

- **Admin Orders Page**: The administrative interface for managing customer orders and payments
- **Order Status**: The verification state of an order (0=pending verification, 1=verified, 2=cancelled)
- **Payment Verification Workflow**: The process where administrators confirm receipt of payment and mark orders as verified
- **Backend Database**: The MySQL database that stores order information and status
- **Order Creation Process**: The system process that creates new orders when customers make payments

## Requirements

### Requirement 1

**User Story:** As an administrator, I want new orders to appear with "待核实" (pending verification) status by default, so that I can properly verify payments before marking them as complete.

#### Acceptance Criteria

1. WHEN a new order is created THEN the system SHALL set the default status to 0 (pending verification)
2. WHEN the admin views the orders list THEN the system SHALL display new orders as "待核实"
3. WHEN an order is pending verification THEN the system SHALL allow the admin to mark it as verified
4. WHEN an order is already verified THEN the system SHALL prevent duplicate verification actions
5. WHEN the database stores order status THEN the system SHALL use consistent status codes (0=pending, 1=verified, 2=cancelled)

### Requirement 2

**User Story:** As an administrator, I want to manually verify payments and update order status, so that I can maintain accurate records of confirmed payments.

#### Acceptance Criteria

1. WHEN viewing a pending order THEN the system SHALL display a "标记已核实" (mark as verified) button
2. WHEN clicking the verification button THEN the system SHALL show a confirmation dialog with order details
3. WHEN confirming verification THEN the system SHALL update the order status to 1 (verified) in the database
4. WHEN the status is updated THEN the system SHALL refresh the display to show "已核实" status
5. WHEN the verification is complete THEN the system SHALL update the statistics counters accordingly

### Requirement 3

**User Story:** As a system administrator, I want the order creation process to consistently set the correct default status, so that the payment verification workflow operates as intended.

#### Acceptance Criteria

1. WHEN the payment system creates an order THEN the system SHALL insert the record with status = 0
2. WHEN the database schema defines the orders table THEN the system SHALL set the default value for status column to 0
3. WHEN existing orders have incorrect status THEN the system SHALL provide a way to correct the data
4. WHEN the order status is queried THEN the system SHALL return the accurate current status
5. WHEN the frontend displays orders THEN the system SHALL correctly map database status to display labels