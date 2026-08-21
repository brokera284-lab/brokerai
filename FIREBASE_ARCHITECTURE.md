# Broker AI - Enterprise Firebase Architecture Specification

As the Lead Software Architect of Broker AI, this document specifies the complete, scalable, and secure enterprise Firebase Architecture. This architecture is designed to support millions of property listings, brokers, and buyers while maintaining sub-second performance, strict Zero-Trust security, and simple maintenance.

---

## Architectural Principles

1. **Anti-Blob & PII Isolation Policy**: Heavy objects (such as image lists, AI summaries, vector embeddings, and detailed analytics) are strictly decoupled from the primary listing and user documents. This guarantees that listing searches load in under 100ms and users can query datasets without downloading unnecessary MBs of secondary data.
2. **Normalized Hierarchies**: Relationships between core entities (Developers, Companies, Projects, and Properties) are clearly defined using explicit, indexed reference IDs.
3. **Subcollection Segmentation**: High-frequency, unbounded lists (such as messages in a chat conversation or favorites in a user's library) are mapped to subcollections. Firestore collections can hold billions of documents; this guarantees unlimited scaling with $O(1)$ read complexity.
4. **Zero-Trust Security & Role-Based Access Control (RBAC)**: All read and write operations are strictly validated at the database level using `firestore.rules`. System-sensitive fields (like user roles, premium subscription tier, and AI analysis data) are immutable from the client-side.

---

## System Modules Registry

Below is the exhaustive specification of the 24 independent, scalable architectural modules.

### 1. Authentication (Auth Metadata)
*   **Collection Path**: `/users/{userId}/private/auth`
*   **Description**: Holds sensitive authentication metadata to extend Firebase Auth without exposing private fields to public queries.
*   **Document Structure**:
    ```typescript
    interface AuthMetadata {
      uid: string;                 // Matches Firebase Auth UID
      email: string;               // User's primary email address
      emailVerified: boolean;      // Email verification status
      mfaEnabled: boolean;         // Multi-Factor Authentication flag
      providers: string[];         // E.g., ['google.com', 'password']
      lastLoginAt: Timestamp;      // Server timestamp of last session init
      createdAt: Timestamp;        // Registration timestamp
    }
    ```
*   **Required Indexes**:
    *   Single-field: `email` (Ascending)
*   **Relationships**:
    *   `1:1` with `/users/{userId}` (Public Profile)
*   **Read Permissions**: Strictly restricted to Owner (`request.auth.uid == userId`) and Admins.
*   **Write Permissions**: Write-only during signup / registration; updates allowed only on `lastLoginAt` and `providers` (restricted to matching Owner).

### 2. Users (Public & Broker Profiles)
*   **Collection Path**: `/users/{userId}`
*   **Description**: Public profiles for Brokers, Buyers, Developers, and Admins.
*   **Document Structure**:
    ```typescript
    interface UserProfile {
      id: string;                  // Matches Firebase Auth UID
      name: string;                // Legal display name
      displayName: string;         // Broker's public brand name
      photoUrl: string;            // Avatar URL
      phoneNumber: string;         // Contact phone number
      role: 'broker' | 'buyer' | 'developer_admin' | 'company_admin' | 'admin';
      isPremium: boolean;          // Premium CRM access subscription (Server-only writable)
      createdAt: Timestamp;
      updatedAt: Timestamp;
    }
    ```
*   **Required Indexes**:
    *   Single-field: `role`
    *   Composite: `role` (Asc) + `createdAt` (Desc)
*   **Relationships**:
    *   `1:N` with `/properties` (Properties listed by broker)
    *   `1:N` with `/users/{userId}/favorites`
*   **Read Permissions**: Read allowed for all authenticated users (needed to display broker credentials).
*   **Write Permissions**: Owners can update `name`, `displayName`, `photoUrl`, and `phoneNumber`. Only System Admins can update `role` and `isPremium`.

### 3. Companies (Brokerage Agencies)
*   **Collection Path**: `/companies/{companyId}`
*   **Description**: Holds real estate agency/brokerage company registry details.
*   **Document Structure**:
    ```typescript
    interface Company {
      id: string;
      name: string;
      logoUrl: string;
      commercialRegistration: string; // Egyptian CR tax registry number
      website: string;
      address: string;
      isVerified: boolean;         // Verified by system admins (Server-only)
      ownerUid: string;            // Reference to UserProfile UID (role = company_admin)
      createdAt: Timestamp;
    }
    ```
*   **Required Indexes**:
    *   Single-field: `isVerified`
    *   Composite: `ownerUid` (Asc) + `createdAt` (Desc)
*   **Relationships**:
    *   `1:N` with `/users` (where `companyId` matches, for brokers working under the agency)
*   **Read Permissions**: Publicly readable.
*   **Write Permissions**: Only the `ownerUid` can update agency details. Admin only can verify (`isVerified`).

### 4. Developers (Real Estate Builders)
*   **Collection Path**: `/developers/{developerId}`
*   **Description**: Master registry of prominent real estate developers (e.g., Emaar, SODIC, TMG).
*   **Document Structure**:
    ```typescript
    interface Developer {
      id: string;
      name: string;
      logoUrl: string;
      about: string;
      establishedYear: number;
      isFeatured: boolean;
      createdAt: Timestamp;
    }
    ```
*   **Required Indexes**:
    *   Single-field: `isFeatured` (Ascending)
*   **Relationships**:
    *   `1:N` with `/projects` (built by developer)
*   **Read Permissions**: Publicly readable.
*   **Write Permissions**: Strictly writeable only by System Admins or verified `developer_admin` users linked to this developer.

### 5. Projects (Compounds & Residential Developments)
*   **Collection Path**: `/projects/{projectId}`
*   **Description**: Gated compounds, projects, and community developments.
*   **Document Structure**:
    ```typescript
    interface Project {
      id: string;
      developerId: string;         // Reference to `/developers/{developerId}`
      name: string;                // Project/Compound name (e.g., "Mivida")
      description: string;
      locationName: string;        // Ref to Location name (e.g. "New Cairo")
      latitude: number;
      longitude: number;
      deliveryDate: Timestamp;     // Estimated phase hand-over date
      amenities: string[];         // Gated amenities
      startingPrice: number;       // Starting unit pricing in EGP
      createdAt: Timestamp;
    }
    ```
*   **Required Indexes**:
    *   Composite: `developerId` (Asc) + `startingPrice` (Asc)
    *   Composite: `locationName` (Asc) + `startingPrice` (Asc)
*   **Relationships**:
    *   `N:1` with `/developers`
    *   `1:N` with `/properties`
*   **Read Permissions**: Publicly readable.
*   **Write Permissions**: Restricted to verified `developer_admin` (or `admin`).

### 6. Properties (Listed Units)
*   **Collection Path**: `/properties/{propertyId}`
*   **Description**: The primary listings collection. Stripped of heavy assets to maintain search performance.
*   **Document Structure**:
    ```typescript
    interface Property {
      id: string;
      projectId: string | null;    // Gated project ref (optional for standalone units)
      title: string;
      description: string;
      price: number;               // Normalized price in EGP
      location: string;            // Synonymous Location name (e.g. "Sheikh Zayed")
      propertyType: 'apartment' | 'villa' | 'penthouse' | 'chalet' | 'townhouse';
      legalPaperStatus: 'verified_boost' | 'verified' | 'none';
      bedrooms: number;
      bathrooms: number;
      area: number;                // Area in square meters (sqm)
      isFurnished: boolean;
      finishingType: string;       // E.g., 'fully_finished', 'core_and_shell'
      ownerName: string;           // Direct owner/seller name
      ownerPhone: string;          // Direct owner contact phone
      brokerUid: string;           // Ref to listing agent in `/users`
      status: 'available' | 'sold' | 'rented' | 'pending';
      createdAt: Timestamp;
      updatedAt: Timestamp;
    }
    ```
*   **Required Indexes**:
    *   Single-field: `price`, `location`, `propertyType`
    *   Composite: `location` (Asc) + `propertyType` (Asc) + `price` (Asc)
    *   Composite: `brokerUid` (Asc) + `status` (Asc)
*   **Relationships**:
    *   `N:1` with `/projects` and `/users` (brokerUid)
    *   `1:1` with `/property_ai_analysis`
    *   `1:1` with `/property_embeddings`
    *   `1:N` with `/properties/{propertyId}/images`
*   **Read Permissions**: Publicly readable if status is `available`. Private if status is `pending`.
*   **Write Permissions**: Authenticated listing Broker (`request.auth.uid == brokerUid`) can write. Only Admins can modify `legalPaperStatus`.

### 7. Property Images
*   **Collection Path**: `/properties/{propertyId}/images/{imageId}`
*   **Description**: High-resolution image galleries stored separately from the listing metadata.
*   **Document Structure**:
    ```typescript
    interface PropertyImage {
      id: string;
      url: string;                 // Storage CDN URL
      isPrimary: boolean;          // Set as hero/cover photograph
      orderIndex: number;          // Visual display sequence order (0, 1, 2...)
      uploadedAt: Timestamp;
    }
    ```
*   **Required Indexes**:
    *   Composite: `isPrimary` (Asc) + `orderIndex` (Asc)
*   **Relationships**:
    *   `N:1` parent-child relation with `/properties/{propertyId}`
*   **Read Permissions**: Publicly readable.
*   **Write Permissions**: Restricted to the owner of the parent Property listing (Broker).

### 8. Property AI Analysis
*   **Collection Path**: `/property_ai_analysis/{propertyId}`
*   **Description**: Distilled investment analysis and financial estimations computed by Gemini.
*   **Document Structure**:
    ```typescript
    interface PropertyAIAnalysis {
      propertyId: string;          // Maps 1:1 to propertyId
      investmentScore: number;     // AI evaluation score (1-10)
      rentalYieldEstimate: number; // Projected annual rental yield %
      capitalAppreciationEstimate: number; // Projected annual appreciation %
      marketComparison: string;    // Markdown comparison text
      legalRiskAssessment: string; // Title deed and legal risk audit summary
      suggestedSellingPoints: string[]; // Key psychological hooks for leads
      generatedAt: Timestamp;
    }
    ```
*   **Required Indexes**:
    *   Single-field: `investmentScore`
*   **Relationships**:
    *   `1:1` with `/properties/{propertyId}`
*   **Read Permissions**: Publicly readable (or premium only depending on subscriber role).
*   **Write Permissions**: System/Server-only. The client is forbidden from writing to this path.

### 9. Property Embeddings
*   **Collection Path**: `/property_embeddings/{propertyId}`
*   **Description**: Vector embeddings of the property description and metrics for neural search.
*   **Document Structure**:
    ```typescript
    interface PropertyEmbedding {
      propertyId: string;
      vector: number[];            // E.g., 1536 float array (Gemini Embedding)
      textChunk: string;           // Formatted textual representation
      updatedAt: Timestamp;
    }
    ```
*   **Required Indexes**: None (processed server-side for similarity indexing).
*   **Relationships**:
    *   `1:1` with `/properties/{propertyId}`
*   **Read Permissions**: System/Server-only. Clients cannot fetch raw vectors.
*   **Write Permissions**: System/Server-only.

### 10. Conversations (Chat Rooms)
*   **Collection Path**: `/conversations/{conversationId}`
*   **Description**: Chat rooms between Brokers and prospective buyers.
*   **Document Structure**:
    ```typescript
    interface Conversation {
      id: string;
      participantUids: string[];   // Array of length 2: [BrokerUID, BuyerUID]
      propertyId: string | null;   // Optional context listing ID
      lastMessageSnippet: string;  // Last message text preview
      lastMessageAt: Timestamp;    // Timestamp for ordering inbox lists
      unreadCounts: {              // Unread counts per participant UID
        [uid: string]: number;
      };
    }
    ```
*   **Required Indexes**:
    *   Single-field: `participantUids` (Array-contains)
    *   Composite: `participantUids` (Array-contains) + `lastMessageAt` (Descending)
*   **Relationships**:
    *   `1:N` with `/conversations/{conversationId}/messages`
*   **Read Permissions**: Only users whose UID is listed inside the `participantUids` array.
*   **Write Permissions**: Authenticated users in the array can initiate and update unread counters.

### 11. Messages (Chat Lines)
*   **Collection Path**: `/conversations/{conversationId}/messages/{messageId}`
*   **Description**: Instant chat text lines.
*   **Document Structure**:
    ```typescript
    interface Message {
      id: string;
      senderUid: string;           // Sender UID
      content: string;             // Text body
      imageUrl: string | null;     // Optional image transfer
      createdAt: Timestamp;
      isReadBy: string[];          // List of recipient UIDs who have read this
    }
    ```
*   **Required Indexes**:
    *   Single-field: `createdAt` (Ascending)
*   **Relationships**:
    *   `N:1` parent-child relation with `/conversations/{conversationId}`
*   **Read Permissions**: Conversation participants only.
*   **Write Permissions**: Sender UID must match `request.auth.uid`.

### 12. Favorites (Bookmarks)
*   **Collection Path**: `/users/{userId}/favorites/{propertyId}`
*   **Description**: User bookmark list mapped as a clean subcollection.
*   **Document Structure**:
    ```typescript
    interface Favorite {
      id: string;                  // Maps directly to propertyId
      propertyId: string;
      addedAt: Timestamp;
    }
    ```
*   **Required Indexes**:
    *   Single-field: `addedAt`
*   **Relationships**:
    *   `N:1` with `/users/{userId}`
    *   `N:1` with `/properties/{propertyId}`
*   **Read Permissions**: Owner of the profile (`request.auth.uid == userId`) only.
*   **Write Permissions**: Owner of the profile only.

### 13. Saved Searches
*   **Collection Path**: `/users/{userId}/saved_searches/{searchId}`
*   **Description**: User subscription to search criteria to trigger alerts.
*   **Document Structure**:
    ```typescript
    interface SavedSearch {
      id: string;
      queryFilters: {
        location?: string;
        minPrice?: number;
        maxPrice?: number;
        propertyType?: string;
        bedrooms?: number;
      };
      searchName: string;
      emailNotificationEnabled: boolean;
      createdAt: Timestamp;
    }
    ```
*   **Required Indexes**:
    *   Single-field: `createdAt`
*   **Relationships**:
    *   `N:1` with `/users/{userId}`
*   **Read Permissions**: Owner of the profile only.
*   **Write Permissions**: Owner of the profile only.

### 14. Leads
*   **Collection Path**: `/leads/{leadId}`
*   **Description**: AI-Qualified perspective buyers available for Brokers to claim.
*   **Document Structure**:
    ```typescript
    interface Lead {
      id: string;
      name: string;
      email: string;
      phoneNumber: string;
      budget: string;              // Budget criteria (E.g., "12,000,000 EGP")
      propertyType: string;        // E.g., 'villa'
      location: string;            // E.g., 'New Cairo'
      legalPapersRequired: boolean;
      qualification: 'cold' | 'warm' | 'hot';
      value: number;               // Purchase/claim cost in EGP (Server-only)
      status: 'available' | 'claimed';
      claimedBy: string | null;    // Broker Uid
      claimedByEmail: string | null;
      chatId: string;              // Conversation ID with Assistant
      createdAt: Timestamp;
      claimedAt: Timestamp | null;
    }
    ```
*   **Required Indexes**:
    *   Single-field: `status`
    *   Composite: `status` (Asc) + `qualification` (Asc)
    *   Composite: `claimedBy` (Asc) + `createdAt` (Desc)
*   **Relationships**:
    *   `N:1` with `/users` (brokerUid)
*   **Read Permissions**: Authenticated Brokers can search/read all `available` leads. Only the claiming Broker can read `claimed` leads.
*   **Write Permissions**: Signed-in brokers can initiate a "Claim" transaction (write status to 'claimed' and assign self). System handles actual balance updates.

### 15. Analytics
*   **Collection Path**: `/analytics_events/{eventId}`
*   **Description**: Clickstream and event logs to measure compound/property interest.
*   **Document Structure**:
    ```typescript
    interface AnalyticsEvent {
      id: string;
      userUid: string | null;      // Visitor UID (optional)
      eventType: 'view_property' | 'lead_qualified' | 'search_executed' | 'favorites_added';
      propertyId: string | null;   // Linked listing
      metadata: {
        [key: string]: any;
      };
      timestamp: Timestamp;
    }
    ```
*   **Required Indexes**:
    *   Composite: `eventType` (Asc) + `timestamp` (Desc)
    *   Composite: `propertyId` (Asc) + `eventType` (Asc)
*   **Relationships**:
    *   References `/users` and `/properties`
*   **Read Permissions**: Strictly System Admins only.
*   **Write Permissions**: Append-only (clients can write, never update or delete).

### 16. Notifications
*   **Collection Path**: `/users/{userId}/notifications/{notificationId}`
*   **Description**: Personal real-time alerts.
*   **Document Structure**:
    ```typescript
    interface Notification {
      id: string;
      title: string;
      body: string;
      type: 'lead_alert' | 'wallet_alert' | 'favorite_update' | 'system_broadcast';
      link: string;                // Navigation deep link
      isRead: boolean;
      createdAt: Timestamp;
    }
    ```
*   **Required Indexes**:
    *   Composite: `isRead` (Asc) + `createdAt` (Desc)
*   **Relationships**:
    *   `N:1` parent-child relation with `/users/{userId}`
*   **Read Permissions**: Owner of the profile only.
*   **Write Permissions**: System/Server-only.

### 17. Reports (Issues / False Lead Claims)
*   **Collection Path**: `/reports/{reportId}`
*   **Description**: Broker complaints about inaccurate AI qualifications or bad listings.
*   **Document Structure**:
    ```typescript
    interface Report {
      id: string;
      reporterUid: string;         // Broker UID reporting
      targetType: 'property' | 'lead_false_assessment' | 'user';
      targetId: string;            // Property, Lead, or User ID
      reason: string;
      details: string;
      status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
      createdAt: Timestamp;
    }
    ```
*   **Required Indexes**:
    *   Single-field: `status`
    *   Composite: `reporterUid` (Asc) + `createdAt` (Desc)
*   **Read Permissions**: Reporter only and System Admins.
*   **Write Permissions**: Authenticated users can create (`reporterUid` must equal current auth UID). Admins can update status.

### 18. Reviews
*   **Collection Path**: `/reviews/{reviewId}`
*   **Description**: Buyer/client ratings of Broker performance.
*   **Document Structure**:
    ```typescript
    interface Review {
      id: string;
      reviewerUid: string;         // Customer UID
      targetUid: string;           // Broker UID being reviewed
      propertyId: string | null;   // Linked deal context
      rating: number;              // 1 to 5 stars
      reviewText: string;
      createdAt: Timestamp;
    }
    ```
*   **Required Indexes**:
    *   Composite: `targetUid` (Asc) + `rating` (Desc)
*   **Relationships**:
    *   References `/users` (reviewer and target)
*   **Read Permissions**: Publicly readable.
*   **Write Permissions**: Signed-in reviewer (`reviewerUid == request.auth.uid`).

### 19. Locations (Regional Master)
*   **Collection Path**: `/locations/{locationId}`
*   **Description**: Pre-loaded geographical hierarchy (e.g. New Cairo -> Tagamo Fifth Settlement).
*   **Document Structure**:
    ```typescript
    interface Location {
      id: string;                  // E.g., "new-cairo"
      name: string;                // English name
      arabicName: string;          // Arabic name
      parentLocationId: string | null; // E.g., "cairo"
      type: 'city' | 'district' | 'subdistrict' | 'compound';
      popularityScore: number;     // Helps order suggestions
    }
    ```
*   **Required Indexes**:
    *   Composite: `parentLocationId` (Asc) + `popularityScore` (Desc)
*   **Read Permissions**: Publicly readable.
*   **Write Permissions**: Admins only.

### 20. Amenities (Feature Registry)
*   **Collection Path**: `/amenities/{amenityId}`
*   **Description**: Consolidated list of amenities for compounds and individual units.
*   **Document Structure**:
    ```typescript
    interface Amenity {
      id: string;                  // E.g., "swimming-pool"
      name: string;                // E.g., "Swimming Pool"
      arabicName: string;          // E.g., "حمام سباحة"
      iconName: string;            // Lucide Icon name
      category: 'indoor' | 'outdoor' | 'services' | 'community';
    }
    ```
*   **Read Permissions**: Publicly readable.
*   **Write Permissions**: Admins only.

### 21. Settings
*   **Collection Path**: `/settings/{settingId}`
*   **Description**: Global application configuration.
*   **Document Structure**:
    ```typescript
    interface AppSettings {
      id: string;                  // E.g., "global_config"
      leadPriceEgp: number;        // Cost to claim a lead
      premiumSubscriptionPriceEgp: number;
      maintenanceMode: boolean;
      exchangeRates: {             // Key relative to 1 EGP
        [currency: string]: number;
      };
      updatedAt: Timestamp;
    }
    ```
*   **Read Permissions**: Publicly readable.
*   **Write Permissions**: Admins only.

### 22. Activity Logs
*   **Collection Path**: `/activity_logs/{logId}`
*   **Description**: Security audit logs recording sensitive operations.
*   **Document Structure**:
    ```typescript
    interface ActivityLog {
      id: string;
      userUid: string;
      userEmail: string;
      action: 'wallet_deposit' | 'lead_claimed' | 'property_deleted' | 'admin_override';
      ipAddress: string;
      userAgent: string;
      timestamp: Timestamp;
    }
    ```
*   **Required Indexes**:
    *   Composite: `userUid` (Asc) + `timestamp` (Desc)
*   **Read Permissions**: Admins only.
*   **Write Permissions**: System/Server-only. Append-only.

### 23. Search Cache
*   **Collection Path**: `/search_cache/{cacheId}`
*   **Description**: Caches expensive combined search result IDs for speed optimization.
*   **Document Structure**:
    ```typescript
    interface SearchCache {
      id: string;                  // MD5 of query parameters
      queryText: string;
      resultsCount: number;
      cachedResultPropertyIds: string[]; // List of matching property IDs
      createdAt: Timestamp;
      expiresAt: Timestamp;        // Cache TTL (e.g., 1 hour)
    }
    ```
*   **Required Indexes**:
    *   Single-field: `expiresAt`
*   **Read Permissions**: Signed-in users only.
*   **Write Permissions**: System/Server-only.

### 24. AI Memory (Personalized context)
*   **Collection Path**: `/users/{userId}/ai_memory/{memoryId}`
*   **Description**: Real-time preferences extracted by Broker AI to customize buyer interactions.
*   **Document Structure**:
    ```typescript
    interface AIMemory {
      id: string;                  // E.g., "preferences"
      recentInterests: {
        propertyType?: string;
        budgetRange?: string;
        preferredLocations?: string[];
      };
      userProfileSummary: string;  // AI-synthesized context
      chatEngagementCount: number;
      lastInteractionAt: Timestamp;
    }
    ```
*   **Relationships**:
    *   `N:1` with `/users/{userId}`
*   **Read Permissions**: Owner of the profile and AI system service only.
*   **Write Permissions**: Owner of the profile and AI system service only.

---

## Enterprise-Grade Relational Schema Map
```
  [Auth User]
       │ (1:1 Auth Metadata)
       ▼
   [UserProfile] (Role: Broker / Buyer)
       │
       ├───────► [Favorites] (Subcollection) ────► [Properties] (N:1 Link)
       │
       ├───────► [Saved Searches] (Subcollection)
       │
       ├───────► [AI Memory] (Subcollection)
       │
       └───────► [Notifications] (Subcollection)

   [Companies] (Agency Registry)
       │ (1:N Brokers)
       ▼
   [UserProfile] (role = broker)
       │
       ├───────► [Properties] (1:N Listings)
       │             │
       │             ├───────► [Property Images] (Subcollection)
       │             │
       │             ├───────► [Property AI Analysis] (1:1 Decoupled)
       │             │
       │             └───────► [Property Embeddings] (1:1 Decoupled)
       │
       └───────► [Leads] (Claims available available/claimed status)
```

This enterprise architecture separates high-frequency subcollections, isolates PII / financial fields, separates massive blobs (images, vectors, analysis), and ensures strict Zero-Trust indexing.
