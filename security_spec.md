# Security Specification & Threat Model: Broker AI

This document establishes the Attribute-Based Access Control (ABAC) invariants and security specifications for the Broker AI Firestore database.

## 1. Core Data Invariants

1. **Anti-Privilege-Escalation**: Standard users (brokers, buyers) can never modify their own `role`, `isPremium`, `walletBalance`, `subscription` parameters, or `subscriptionHistory` array.
2. **Dynamic Configuration Sovereignty**: The global settings document (`/settings/system`) contains financial constants and network switches. Only authenticated Super Admin (`brokera284@gmail.com`) can write, update, or overwrite this document.
3. **Registry Audit Integrity**: Activity logs (`/activity_logs/{logId}`) are strictly append-only (immutable). Once written, they can never be updated, edited, or modified by any user. Only the Super Admin can delete logs.
4. **Isolated Transactions & Ledger Records**: Financial transactions (`/transactions/{txId}`) represent wallet operations. No client can create or modify transactions directly; only the Super Admin can authorize balance adjustments.
5. **Verified Company Claims**: Brokerage agencies (`/companies/{companyId}`) can be updated by their owners for description and address, but the `status` and `isVerified` boolean can only be mutated by the Super Admin.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 payloads represent attacks designed to bypass identity, integrity, or state invariants.

### Payload 1: Self-Promote to Admin (Identity Spoofing)
* **Target Path**: `/users/attacker_uid`
* **Method**: `UPDATE`
* **Vulnerability Target**: Modifying own role.
* **Payload**:
```json
{
  "role": "admin"
}
```

### Payload 2: Self-Grant Premium Status (Privilege Escalation)
* **Target Path**: `/users/attacker_uid`
* **Method**: `UPDATE`
* **Vulnerability Target**: Bypassing premium payment state.
* **Payload**:
```json
{
  "isPremium": true
}
```

### Payload 3: Overwrite Wallet Balance (Value Poisoning)
* **Target Path**: `/users/attacker_uid`
* **Method**: `UPDATE`
* **Vulnerability Target**: Arbitrary wallet balance adjustment.
* **Payload**:
```json
{
  "walletBalance": 1000000
}
```

### Payload 4: Override Global Pricing Variables (Sovereignty Bypass)
* **Target Path**: `/settings/system`
* **Method**: `SET` (Write)
* **Vulnerability Target**: Changing lead prices and subscription license costs.
* **Payload**:
```json
{
  "leadPriceEgp": 1,
  "premiumSubscriptionPriceEgp": 1,
  "maintenanceMode": false
}
```

### Payload 5: Poison Auditable Security Log (Audit Injection)
* **Target Path**: `/activity_logs/some_log_id`
* **Method**: `UPDATE`
* **Vulnerability Target**: Covering tracks by overwriting a previous audit log.
* **Payload**:
```json
{
  "action": "admin_approved",
  "details": "Attacker erased evidence of intrusion",
  "status": "success"
}
```

### Payload 6: Force Self-Verification of Corporate Agency (Corporate Identity Spoofing)
* **Target Path**: `/companies/attacker_company`
* **Method**: `UPDATE`
* **Vulnerability Target**: Normal user verifying their own business registry without admin review.
* **Payload**:
```json
{
  "isVerified": true,
  "status": "approved"
}
```

### Payload 7: Fabricate Sibling Transaction Record (Ledger Counterfeiting)
* **Target Path**: `/transactions/fake_tx_123`
* **Method**: `CREATE`
* **Vulnerability Target**: Writing a fraudulent credit transaction.
* **Payload**:
```json
{
  "userId": "attacker_uid",
  "amount": 5000,
  "type": "credit",
  "details": "Simulated Google Pay Settlement"
}
```

### Payload 8: Hijack Sibling Property Listing (Authorization Cross-over)
* **Target Path**: `/units/legitimate_broker_unit`
* **Method**: `UPDATE`
* **Vulnerability Target**: Modifying property data owned by another broker.
* **Payload**:
```json
{
  "price": 10,
  "ownerUid": "attacker_uid"
}
```

### Payload 9: Hijack Sibling Refund Claim (Authorization Cross-over)
* **Target Path**: `/refunds/legitimate_refund_request`
* **Method**: `UPDATE`
* **Vulnerability Target**: Mutating another user's active refund request.
* **Payload**:
```json
{
  "status": "approved"
}
```

### Payload 10: Inject Unbounded Vector String to Unit ID (Denial of Wallet)
* **Target Path**: `/units/JUNK_CHAR_STRING_REPEATED_TO_1MB`
* **Method**: `CREATE`
* **Vulnerability Target**: ID Poisoning and storage exhaustion.
* **Payload**:
```json
{
  "ownerUid": "attacker_uid",
  "title": "Poison Property"
}
```

### Payload 11: Spoof Verification Status on Sibling Lead (Integrity Overwrite)
* **Target Path**: `/leads/some_active_lead`
* **Method**: `UPDATE`
* **Vulnerability Target**: Unauthenticated modification of general leads.
* **Payload**:
```json
{
  "qualification": "hot",
  "value": 15000
}
```

### Payload 12: Erase All Active Security Audits (Log Destruction)
* **Target Path**: `/activity_logs/all`
* **Method**: `DELETE` (As normal user)
* **Vulnerability Target**: Erasing the entire security activity logs history.
* **Payload**: `N/A` (Delete operation)

---

## 3. The Test Suite Strategy

All the above malicious payloads are configured to return `PERMISSION_DENIED` under the new `firestore.rules` configuration.
