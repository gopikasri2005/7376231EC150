# Stage 1

## Priority Inbox design

The system ranks notifications by combining a type weight and recency score.

- Placement notifications receive the highest base weight.
- Result notifications receive medium weight.
- Event notifications receive the lowest weight.
- Recent notifications are ranked higher within the same type class.

The app computes a combined priority score for each notification:

- `score = typeWeight * 10^12 + timestampMillis`

This ensures placement always beats result and event, while recency still orders notifications inside the same type.

## Efficient top-10 maintenance

For a continuous stream of incoming notifications, the app maintains the current top `n` using a fixed-size min-heap:

- Keep at most `n` items in the heap.
- When a new notification arrives:
  - compute its priority score
  - if the heap has fewer than `n` items, push it
  - otherwise compare with the heap root (lowest top score)
  - if the new item is higher, replace the root

This approach costs `O(log n)` per new notification instead of `O(m log m)` for sorting all notifications.

## Frontend implementation notes

The React app provides two pages:

1. **All Notifications**
   - fetches notifications from the API
   - supports pagination and type filtering
   - shows unread notifications with a `NEW` badge
   - marks notifications as viewed in `localStorage`

2. **Priority Inbox**
   - fetches a larger batch and selects the top `n`
   - supports limit selection for the top inbox (10, 15, 20)
   - supports notification type filter
   - reuses the same viewed/unviewed logic

## Why this design?

- It separates the complete feed from the priority inbox.
- It avoids database changes by computing priority in the frontend.
- It provides a consistent user experience with clear unread state.
- It is efficient for an evolving stream of notifications.
