# Design Document: Membership Enhancements

## Overview

This design document specifies the technical implementation for expanding the SIPARK membership system with three major feature sets: suspension/freeze functionality, discounts & promotions, and benefits & restrictions. The system is built as an Electron application with React (TypeScript) frontend and SQLite database backend.

### Goals

1. Enable flexible membership management through suspension/freeze capabilities
2. Implement comprehensive promotion and referral systems to drive customer acquisition
3. Provide granular control over membership benefits and access restrictions
4. Maintain full integration with existing cash box and sales systems
5. Ensure data integrity and audit trail for all operations

### Non-Goals

1. Integration with external payment gateways (uses existing cash box system)
2. Mobile application development (Electron desktop only)
3. Multi-location support (single location focus)
4. Automated email/SMS notifications (manual notification system)

## Architecture

### System Context

The membership enhancements integrate into the existing SIPARK system architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              IPC Handlers (API Layer)                  │ │
│  │  - Suspension Management                               │ │
│  │  - Promotion Management                                │ │
│  │  - Referral System                                     │ │
│  │  - Benefits Validation                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Database Layer (SQLite)                   │ │
│  │  - membership_suspensions                              │ │
│  │  - promotions, promotion_usage                         │ │
│  │  - referrals                                           │ │
│  │  - membership_benefits, membership_restrictions        │ │
│  │  - blackout_dates, zones                               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ IPC Communication
                           │
┌─────────────────────────────────────────────────────────────┐
│                  React Renderer Process                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  UI Components                         │ │
│  │  - SuspendMembershipModal                              │ │
│  │  - PromotionManager                                    │ │
│  │  - ReferralDashboard                                   │ │
│  │  - BenefitsConfigurator                                │ │
│  │  - AccessValidator                                     │ │
│  │  - Enhanced Reports                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 18+ with TypeScript
- **Backend**: Electron IPC handlers
- **Database**: SQLite 3
- **UI Components**: Existing custom component library (Card, Button, Input, Dialog)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React hooks (useState, useEffect)
- **Custom Hooks**: useCurrency, useNotification, useCashBox, usePrinter

## Components and Interfaces

### Database Schema

#### New Tables

**membership_suspensions**

```sql
CREATE TABLE membership_suspensions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_membership_id INTEGER NOT NULL,
  suspension_reason TEXT NOT NULL CHECK(suspension_reason IN ('vacation', 'illness', 'personal', 'other')),
  reason_description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  days_suspended INTEGER,
  suspended_by INTEGER,
  resumed_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_membership_id) REFERENCES client_memberships(id),
  FOREIGN KEY (suspended_by) REFERENCES users(id),
  FOREIGN KEY (resumed_by) REFERENCES users(id)
);

CREATE INDEX idx_suspensions_membership ON membership_suspensions(client_membership_id);
CREATE INDEX idx_suspensions_dates ON membership_suspensions(start_date, end_date);
```

**promotions**

```sql
CREATE TABLE promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  promo_code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed_amount', '2x1', 'family_discount')),
  discount_value REAL NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_uses INTEGER,
  max_uses_per_client INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  applicable_membership_types TEXT, -- JSON array of membership type IDs
  is_active BOOLEAN DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_promotions_code ON promotions(promo_code);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_active ON promotions(is_active);
```

**promotion_usage**

```sql
CREATE TABLE promotion_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  promotion_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  client_membership_id INTEGER,
  sale_id INTEGER,
  discount_amount REAL NOT NULL,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (promotion_id) REFERENCES promotions(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (client_membership_id) REFERENCES client_memberships(id),
  FOREIGN KEY (sale_id) REFERENCES sales(id)
);

CREATE INDEX idx_promotion_usage_promotion ON promotion_usage(promotion_id);
CREATE INDEX idx_promotion_usage_client ON promotion_usage(client_id);
```

**referrals**

```sql
CREATE TABLE referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_client_id INTEGER NOT NULL,
  referrer_code TEXT UNIQUE NOT NULL,
  referred_client_id INTEGER,
  referral_status TEXT DEFAULT 'pending' CHECK(referral_status IN ('pending', 'completed', 'credited')),
  credit_amount REAL DEFAULT 0,
  credit_used REAL DEFAULT 0,
  first_purchase_date DATE,
  credit_applied_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_client_id) REFERENCES clients(id),
  FOREIGN KEY (referred_client_id) REFERENCES clients(id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_client_id);
CREATE INDEX idx_referrals_code ON referrals(referrer_code);
CREATE INDEX idx_referrals_status ON referrals(referral_status);
```

**membership_benefits**

```sql
CREATE TABLE membership_benefits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membership_type_id INTEGER NOT NULL,
  benefit_type TEXT NOT NULL CHECK(benefit_type IN ('allowed_hours', 'visit_limits', 'zone_access', 'product_discount', 'service_discount', 'guest_privileges')),
  benefit_config TEXT NOT NULL, -- JSON configuration
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_type_id) REFERENCES memberships(id)
);

CREATE INDEX idx_benefits_membership ON membership_benefits(membership_type_id);
CREATE INDEX idx_benefits_type ON membership_benefits(benefit_type);
```

**membership_restrictions**

```sql
CREATE TABLE membership_restrictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membership_type_id INTEGER NOT NULL,
  restriction_type TEXT NOT NULL CHECK(restriction_type IN ('monthly_visits', 'weekly_visits', 'daily_visits', 'zone_blacklist')),
  restriction_value INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_type_id) REFERENCES memberships(id)
);

CREATE INDEX idx_restrictions_membership ON membership_restrictions(membership_type_id);
```

**blackout_dates**

```sql
CREATE TABLE blackout_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blackout_date DATE NOT NULL,
  membership_type_id INTEGER NOT NULL,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT 0,
  recurrence_pattern TEXT, -- 'yearly', 'monthly', etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_type_id) REFERENCES memberships(id)
);

CREATE INDEX idx_blackout_date ON blackout_dates(blackout_date);
CREATE INDEX idx_blackout_membership ON blackout_dates(membership_type_id);
```

**zones**

```sql
CREATE TABLE zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Modified Tables

**memberships** (add new columns)

```sql
ALTER TABLE memberships ADD COLUMN max_suspension_days INTEGER;
ALTER TABLE memberships ADD COLUMN max_suspensions_per_year INTEGER;
ALTER TABLE memberships ADD COLUMN referral_credit_amount REAL DEFAULT 0;
ALTER TABLE memberships ADD COLUMN referral_discount_percentage REAL DEFAULT 0;
```

**client_memberships** (add status for suspension)

```sql
-- Status values: 'active', 'suspended', 'expired', 'cancelled'
-- Already has status column, just document the new 'suspended' value
```

### API Functions (IPC Handlers)

#### Suspension Management

```typescript
interface SuspensionRequest {
  clientMembershipId: number;
  reason: 'vacation' | 'illness' | 'personal' | 'other';
  reasonDescription?: string;
  suspendedBy: number;
}

interface ResumptionRequest {
  clientMembershipId: number;
  resumedBy: number;
}

// Suspend membership
api.suspendMembership(request: SuspensionRequest): Promise<number>

// Resume membership
api.resumeMembership(request: ResumptionRequest): Promise<void>

// Get suspension history
api.getSuspensionHistory(clientMembershipId: number): Promise<Suspension[]>

// Validate suspension limits
api.validateSuspensionLimits(clientMembershipId: number): Promise<{
  canSuspend: boolean;
  remainingDays: number;
  remainingSuspensions: number;
  message: string;
}>
```

#### Promotion Management

```typescript
interface Promotion {
  id?: number;
  name: string;
  description: string;
  promoCode: string;
  discountType: 'percentage' | 'fixed_amount' | '2x1' | 'family_discount';
  discountValue: number;
  startDate: string;
  endDate: string;
  maxUses?: number;
  maxUsesPerClient: number;
  applicableMembershipTypes?: number[];
  isActive: boolean;
}

// Create promotion
api.createPromotion(promotion: Promotion): Promise<number>

// Update promotion
api.updatePromotion(id: number, promotion: Partial<Promotion>): Promise<void>

// Get all promotions
api.getPromotions(activeOnly?: boolean): Promise<Promotion[]>

// Validate promo code
api.validatePromoCode(code: string, clientId: number, membershipTypeId: number): Promise<{
  valid: boolean;
  promotion?: Promotion;
  discountAmount?: number;
  message: string;
}>

// Apply promotion
api.applyPromotion(promotionId: number, clientId: number, saleId: number, discountAmount: number): Promise<void>
```

#### Referral System

```typescript
interface Referral {
  id?: number;
  referrerClientId: number;
  referrerCode: string;
  referredClientId?: number;
  referralStatus: 'pending' | 'completed' | 'credited';
  creditAmount: number;
  creditUsed: number;
}

// Generate referral code for client
api.generateReferralCode(clientId: number): Promise<string>

// Validate referral code
api.validateReferralCode(code: string): Promise<{
  valid: boolean;
  referrerId?: number;
  message: string;
}>

// Register referred client
api.registerReferredClient(referralCode: string, newClientId: number): Promise<void>

// Process referral credit (on first purchase)
api.processReferralCredit(referredClientId: number, purchaseAmount: number): Promise<void>

// Get referral balance
api.getReferralBalance(clientId: number): Promise<{
  totalCredit: number;
  usedCredit: number;
  availableCredit: number;
  referralCount: number;
}>

// Apply referral credit
api.applyReferralCredit(clientId: number, amount: number, saleId: number): Promise<void>
```

#### Benefits Configuration

```typescript
interface MembershipBenefit {
  id?: number;
  membershipTypeId: number;
  benefitType: 'allowed_hours' | 'visit_limits' | 'zone_access' | 'product_discount' | 'service_discount' | 'guest_privileges';
  benefitConfig: any; // JSON configuration specific to benefit type
  isActive: boolean;
}

// Allowed hours config
interface AllowedHoursConfig {
  weekdays: { start: string; end: string }[];
  weekends: { start: string; end: string }[];
}

// Visit limits config
interface VisitLimitsConfig {
  monthlyLimit?: number;
  weeklyLimit?: number;
  dailyLimit?: number;
}

// Zone access config
interface ZoneAccessConfig {
  allowedZoneIds: number[];
}

// Discount config
interface DiscountConfig {
  discountPercentage: number;
}

// Guest privileges config
interface GuestPrivilegesConfig {
  maxGuests: number;
  guestFeeType: 'free' | 'reduced' | 'full';
  guestFeeAmount?: number;
}

// Configure benefit
api.configureBenefit(benefit: MembershipBenefit): Promise<number>

// Get benefits for membership type
api.getMembershipBenefits(membershipTypeId: number): Promise<MembershipBenefit[]>

// Delete benefit
api.deleteBenefit(benefitId: number): Promise<void>
```

#### Access Validation

```typescript
interface AccessValidationRequest {
  clientId: number;
  clientMembershipId: number;
  zoneId?: number;
  timestamp?: string;
}

interface AccessValidationResult {
  allowed: boolean;
  reason?: string;
  restrictions?: string[];
}

// Validate access
api.validateAccess(request: AccessValidationRequest): Promise<AccessValidationResult>

// Validate hours
api.validateAllowedHours(membershipTypeId: number, timestamp: string): Promise<{
  allowed: boolean;
  message: string;
}>

// Validate visit limits
api.validateVisitLimits(clientMembershipId: number): Promise<{
  allowed: boolean;
  monthlyCount: number;
  weeklyCount: number;
  message: string;
}>

// Validate zone access
api.validateZoneAccess(membershipTypeId: number, zoneId: number): Promise<{
  allowed: boolean;
  message: string;
}>

// Check blackout dates
api.checkBlackoutDate(membershipTypeId: number, date: string): Promise<{
  isBlocked: boolean;
  reason?: string;
}>

// Record usage
api.recordMembershipUsage(clientMembershipId: number, usageType: string, details: any): Promise<void>
```

#### Reporting Functions

```typescript
// Suspension reports
api.getSuspensionReport(startDate: string, endDate: string): Promise<{
  totalSuspensions: number;
  byReason: Record<string, number>;
  averageDays: number;
  byMembershipType: Record<string, number>;
  monthlyTrend: Array<{ month: string; count: number }>;
}>

// Promotion reports
api.getPromotionReport(startDate: string, endDate: string): Promise<{
  promotions: Array<{
    name: string;
    uses: number;
    totalDiscount: number;
    revenue: number;
    conversionRate: number;
  }>;
}>

// Referral reports
api.getReferralReport(startDate: string, endDate: string): Promise<{
  topReferrers: Array<{ clientName: string; referralCount: number }>;
  conversionRate: number;
  totalCredits: number;
  revenueFromReferrals: number;
}>
```

### React Components

#### SuspendMembershipModal

```typescript
interface SuspendMembershipModalProps {
  clientMembership: ClientMembership;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Features:
// - Reason selection dropdown
// - Optional description textarea
// - Display suspension limits
// - Validation before submission
// - Integration with cash box (no payment required for suspension)
```

#### ResumeMembershipModal

```typescript
interface ResumeMembershipModalProps {
  clientMembership: ClientMembership;
  suspension: Suspension;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Features:
// - Display suspension details
// - Calculate days suspended
// - Show new expiration date
// - Confirm resumption
```

#### PromotionManager

```typescript
// Features:
// - List all promotions with filters (active/inactive)
// - Create new promotion form
// - Edit existing promotions
// - View usage statistics
// - Deactivate promotions
// - Generate unique promo codes
```

#### ApplyPromotionInput

```typescript
interface ApplyPromotionInputProps {
  onPromotionApplied: (promotion: Promotion, discountAmount: number) => void;
  clientId: number;
  membershipTypeId: number;
  basePrice: number;
}

// Features:
// - Promo code input field
// - Real-time validation
// - Display discount amount
// - Error messages
// - Integration with SellMembership and RenewMembership
```

#### ReferralDashboard

```typescript
// Features:
// - Display client's referral code
// - Show referral balance
// - List referred clients and their status
// - Show available credits
// - Apply credits to purchases
```

#### BenefitsConfigurator

```typescript
interface BenefitsConfiguratorProps {
  membershipTypeId: number;
}

// Features:
// - Configure allowed hours (weekday/weekend)
// - Set visit limits (monthly/weekly/daily)
// - Select accessible zones
// - Set product/service discounts
// - Configure guest privileges
// - Save/update configurations
```

#### AccessValidator

```typescript
interface AccessValidatorProps {
  clientId: number;
  onAccessGranted: () => void;
  onAccessDenied: (reason: string) => void;
}

// Features:
// - Client lookup
// - Real-time validation
// - Display membership status
// - Show restrictions
// - Record access attempt
```

#### BlackoutDateManager

```typescript
// Features:
// - Calendar view
// - Add blackout dates
// - Select affected membership types
// - Set recurring patterns
// - Delete/modify blackout dates
```

#### Enhanced Reports

```typescript
// SuspensionReport
// - Date range selector
// - Charts: suspensions by reason, by membership type
// - Monthly trend graph
// - Export to PDF/Excel

// PromotionReport
// - Date range selector
// - Table: promotion performance
// - Charts: usage, revenue impact
// - Export to PDF/Excel

// ReferralReport
// - Date range selector
// - Top referrers leaderboard
// - Conversion funnel
// - Export to PDF/Excel
```

## Data Models

### TypeScript Interfaces

```typescript
interface ClientMembership {
  id: number;
  client_id: number;
  client_name: string;
  membership_id: number;
  membership_name: string;
  start_date: string;
  end_date: string;
  status: "active" | "suspended" | "expired" | "cancelled";
  payment_amount: number;
  payment_method: string;
  notes: string;
  created_at: string;
  days_remaining: number;
}

interface Suspension {
  id: number;
  client_membership_id: number;
  suspension_reason: "vacation" | "illness" | "personal" | "other";
  reason_description?: string;
  start_date: string;
  end_date?: string;
  days_suspended?: number;
  suspended_by: number;
  resumed_by?: number;
  created_at: string;
  updated_at: string;
}

interface Promotion {
  id: number;
  name: string;
  description: string;
  promo_code: string;
  discount_type: "percentage" | "fixed_amount" | "2x1" | "family_discount";
  discount_value: number;
  start_date: string;
  end_date: string;
  max_uses?: number;
  max_uses_per_client: number;
  current_uses: number;
  applicable_membership_types?: number[];
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface Referral {
  id: number;
  referrer_client_id: number;
  referrer_code: string;
  referred_client_id?: number;
  referral_status: "pending" | "completed" | "credited";
  credit_amount: number;
  credit_used: number;
  first_purchase_date?: string;
  credit_applied_date?: string;
  created_at: string;
  updated_at: string;
}

interface MembershipBenefit {
  id: number;
  membership_type_id: number;
  benefit_type:
    | "allowed_hours"
    | "visit_limits"
    | "zone_access"
    | "product_discount"
    | "service_discount"
    | "guest_privileges";
  benefit_config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Zone {
  id: number;
  name: string;
  description: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
}

interface BlackoutDate {
  id: number;
  blackout_date: string;
  membership_type_id: number;
  reason: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  created_at: string;
}
```
