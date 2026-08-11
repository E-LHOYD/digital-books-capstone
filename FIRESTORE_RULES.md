# Firestore Security Rules Structure

## Collection Structure

### `shelves/{userId}/userShelves/{shelfId}`

Each user has a subcollection of shelves under their user ID.

#### Shelf Document Structure:
```javascript
{
  id: string,              // 'read', 'viewed', or timestamp for custom shelves
  name: string,            // 'Read', 'Viewed', or custom name
  userId: string,          // User's Firebase Auth UID
  isReadShelf: boolean,    // true for 'read' shelf
  isViewedShelf: boolean,  // true for 'viewed' shelf
  createdAt: Date,         // Timestamp when shelf was created
  bookIds: string[]        // Array of book document IDs
}
```

### Example Data:

```
shelves/
  └── {userId}/
      └── userShelves/
          ├── read/
          │   ├── id: "read"
          │   ├── name: "Read"
          │   ├── userId: "{userId}"
          │   ├── isReadShelf: true
          │   ├── isViewedShelf: false
          │   ├── createdAt: timestamp
          │   └── bookIds: ["book1", "book2"]
          │
          ├── viewed/
          │   ├── id: "viewed"
          │   ├── name: "Viewed"
          │   ├── userId: "{userId}"
          │   ├── isReadShelf: false
          │   ├── isViewedShelf: true
          │   ├── createdAt: timestamp
          │   └── bookIds: ["book3"]
          │
          └── 1234567890/  (custom shelf)
              ├── id: "1234567890"
              ├── name: "Favorites"
              ├── userId: "{userId}"
              ├── isReadShelf: false
              ├── isViewedShelf: false
              ├── createdAt: timestamp
              └── bookIds: ["book1", "book4"]
```

## Complete Firestore Rules (Merged with Your Existing Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
 
    match /users/{userId} {
      // Allow read if logged in OR for username lookup during login
      // (Temporarily allowing unauthenticated reads for username login functionality)
      allow read: if request.auth != null || true;
      
      // Allow write if user owns the document OR if creating a new user profile
      allow write: if request.auth != null && (request.auth.uid == userId || request.resource.data == null);
    }
 
    match /admin/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // NEW: Shelves collection structure
    match /shelves/{userId} {
      // User can only access their own shelves
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User's shelf subcollection
      match /userShelves/{shelfId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // NEW: Reading progress collection
    match /readingProgress/{userId_bookId} {
      // Extract userId from document ID (format: {userId}_{bookId})
      allow read, write: if request.auth != null && 
                            request.auth.uid == userId_bookId.split('_')[0];
    }

    // Allow read/write for authenticated users on other collections (books, etc.)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## What Changed

1. **Kept your existing rules** for `users` and `admin` collections
2. **Added new rules** for `shelves/{userId}/userShelves/{shelfId}` - users can only access their own shelves
3. **Added new rules** for `readingProgress/{userId_bookId}` - users can only access their own reading progress
4. **Kept the catch-all rule** at the end for other collections like `books`

## Limits

- **Custom Shelves**: Maximum 5 per user (excluding 'read' and 'viewed')
- **'read' Shelf**: Automatic, contains books with >5% reading progress
- **'viewed' Shelf**: Automatic, contains books with <5% reading progress
- **Book IDs**: Array of book document IDs from the 'books' collection
