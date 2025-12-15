# Implementation Plan

- [x] 1. Investigate and fix database schema for order status
  - Check current database schema for orders table status column
  - Verify default value for status column is set to 0
  - Create database migration script if needed to fix existing data
  - _Requirements: 1.1, 1.5, 3.1, 3.2_

- [ ]* 1.1 Write property test for order creation default status
  - **Property 1: New orders default to pending status**
  - **Validates: Requirements 1.1, 3.1**

- [ ]* 1.2 Write property test for database schema default value
  - **Property 10: Database schema default value**
  - **Validates: Requirements 3.2**

- [ ] 2. Fix order creation process in backend API
  - Review order creation endpoints to ensure status = 0 is set
  - Update member payment completion logic to set correct status
  - Verify order insertion queries explicitly set status = 0
  - _Requirements: 1.1, 3.1_

- [ ]* 2.1 Write property test for order creation API
  - **Property 1: New orders default to pending status**
  - **Validates: Requirements 1.1, 3.1**

- [x] 3. Verify frontend status mapping and display logic
  - Check AdminAPI.js status mapping logic
  - Verify admin orders page correctly maps status 0 to "待核实"
  - Ensure status 1 maps to "已核实" correctly
  - _Requirements: 1.2, 3.5_

- [ ]* 3.1 Write property test for status display mapping
  - **Property 2: Status display mapping consistency**
  - **Validates: Requirements 1.2, 3.5**

- [x] 4. Fix verification button logic and state management
  - Ensure verification button only shows for status = 0 orders
  - Prevent verification actions on already verified orders (status = 1)
  - Update button state management during async operations
  - _Requirements: 1.3, 1.4, 2.1_

- [ ]* 4.1 Write property test for verification button availability
  - **Property 3: Verification button availability**
  - **Validates: Requirements 1.3, 2.1**

- [ ]* 4.2 Write property test for duplicate verification prevention
  - **Property 4: Duplicate verification prevention**
  - **Validates: Requirements 1.4**

- [x] 5. Implement verification confirmation dialog
  - Ensure confirmation dialog displays correct order details
  - Verify dialog shows order number, amount, and package info
  - Test dialog confirmation and cancellation flows
  - _Requirements: 2.2_

- [ ]* 5.1 Write property test for verification confirmation dialog
  - **Property 6: Verification confirmation dialog**
  - **Validates: Requirements 2.2**

- [x] 6. Fix order verification API and database updates
  - Verify backend verification endpoint updates status correctly
  - Ensure database transaction integrity during status updates
  - Test concurrent verification scenarios
  - _Requirements: 2.3, 3.4_

- [ ]* 6.1 Write property test for status update persistence
  - **Property 7: Status update persistence**
  - **Validates: Requirements 2.3, 3.4**

- [x] 7. Fix frontend display refresh after verification
  - Ensure UI updates immediately after successful verification
  - Update local order data to reflect new status
  - Refresh statistics counters after status changes
  - _Requirements: 2.4, 2.5_

- [ ]* 7.1 Write property test for display refresh after verification
  - **Property 8: Display refresh after verification**
  - **Validates: Requirements 2.4**

- [ ]* 7.2 Write property test for statistics accuracy
  - **Property 9: Statistics accuracy**
  - **Validates: Requirements 2.5**

- [x] 8. Validate status code consistency across system
  - Audit all code that handles order status values
  - Ensure consistent use of 0=pending, 1=verified, 2=cancelled
  - Add validation to prevent invalid status values
  - _Requirements: 1.5_

- [ ]* 8.1 Write property test for status code consistency
  - **Property 5: Status code consistency**
  - **Validates: Requirements 1.5**

- [ ] 9. Create data correction script for existing orders
  - Identify orders with incorrect status in production database
  - Create safe migration script to fix existing data
  - Backup existing data before making changes
  - _Requirements: 3.3_

- [ ] 10. Checkpoint - Ensure all tests pass and verify end-to-end workflow
  - Ensure all tests pass, ask the user if questions arise.
  - Test complete order creation to verification workflow
  - Verify statistics accuracy after multiple operations
  - Confirm admin interface displays correct status information