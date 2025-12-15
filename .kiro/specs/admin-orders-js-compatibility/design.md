# Design Document

## Overview

This design addresses the order status inconsistency issue where new orders are incorrectly showing as "已核实" (verified) instead of "待核实" (pending verification). The solution involves fixing the database schema, updating the order creation process, and ensuring proper status handling throughout the system.

## Architecture

The order status system follows this flow:
1. **Order Creation** → Database inserts with status = 0 (pending)
2. **Admin Review** → Administrator views pending orders
3. **Payment Verification** → Administrator confirms payment receipt
4. **Status Update** → Database updates status to 1 (verified)
5. **Display Update** → Frontend reflects the new status

## Components and Interfaces

### Database Layer
- **Orders Table**: Stores order records with status column
- **Status Column**: INTEGER type with default value 0
- **Status Values**: 0=pending, 1=verified, 2=cancelled

### Backend API Layer
- **Order Creation Endpoint**: Ensures new orders have status = 0
- **Order Listing Endpoint**: Returns orders with current status
- **Order Verification Endpoint**: Updates status from 0 to 1
- **Statistics Endpoint**: Calculates counts by status

### Frontend Layer
- **Admin Orders Page**: Displays orders with correct status mapping
- **Status Display**: Maps database values to Chinese labels
- **Verification Button**: Allows status updates for pending orders
- **Statistics Display**: Shows accurate counts by status

## Data Models

### Order Record Structure
```javascript
{
  id: INTEGER,
  order_number: STRING,
  openid: STRING,
  package_id: STRING,
  amount: DECIMAL,
  status: INTEGER,  // 0=pending, 1=verified, 2=cancelled
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### Status Mapping
```javascript
const statusMapping = {
  0: 'pending_verify',  // 待核实
  1: 'verified',        // 已核实
  2: 'cancelled'        // 已取消
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: New orders default to pending status
*For any* new order creation, the order should be inserted into the database with status = 0 (pending verification)
**Validates: Requirements 1.1, 3.1**

Property 2: Status display mapping consistency
*For any* order with status = 0, the frontend display should show "待核实" (pending verification)
**Validates: Requirements 1.2, 3.5**

Property 3: Verification button availability
*For any* order with status = 0, the admin interface should display the "标记已核实" verification button
**Validates: Requirements 1.3, 2.1**

Property 4: Duplicate verification prevention
*For any* order with status = 1, the system should prevent additional verification actions
**Validates: Requirements 1.4**

Property 5: Status code consistency
*For any* order record in the database, the status value should be within the valid range (0, 1, or 2)
**Validates: Requirements 1.5**

Property 6: Verification confirmation dialog
*For any* pending order verification action, the system should display a confirmation dialog containing order details
**Validates: Requirements 2.2**

Property 7: Status update persistence
*For any* order verification confirmation, the database status should be updated from 0 to 1
**Validates: Requirements 2.3, 3.4**

Property 8: Display refresh after verification
*For any* completed verification action, the frontend should update to show "已核实" status
**Validates: Requirements 2.4**

Property 9: Statistics accuracy
*For any* order status change, the statistics counters should reflect the updated pending/verified counts
**Validates: Requirements 2.5**

Property 10: Database schema default value
*For any* order insertion without explicit status, the database should default the status column to 0
**Validates: Requirements 3.2**

## Error Handling

### Database Errors
- Connection failures during order creation or updates
- Constraint violations on status values
- Transaction rollback scenarios

### API Errors
- Invalid order ID in verification requests
- Concurrent modification conflicts
- Network timeouts during status updates

### Frontend Errors
- Display inconsistencies during status transitions
- Button state management during async operations
- Statistics calculation errors

## Testing Strategy

### Unit Testing
- Database schema validation tests
- Status mapping function tests
- Order creation with default status tests
- Verification button visibility tests

### Property-Based Testing
Using a property-based testing library, we will implement tests for each correctness property:
- Generate random order data and verify status defaults
- Test status transitions across all valid states
- Verify display mapping consistency across all status values
- Test statistics calculations with various order combinations

Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage. Tests will be tagged with comments referencing the specific correctness property from this design document using the format: '**Feature: admin-orders-status-fix, Property {number}: {property_text}**'

### Integration Testing
- End-to-end order creation and verification workflow
- Database consistency checks after status updates
- Frontend-backend synchronization validation
- Statistics accuracy across multiple operations