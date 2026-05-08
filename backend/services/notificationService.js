const axios = require('axios');

const NOTIFICATION_API_URL = 'http://4.224.186.213/evaluation-service/notifications';
const AUTH_TOKEN = 'your_auth_token_here'; // Add your auth token

// Priority weights for notification types
const PRIORITY_WEIGHTS = {
  'Placement': 3,
  'Result': 2,
  'Event': 1
};

/**
 * Calculate priority score for a notification
 * Score = (weight * 1000) + recency_score
 * This ensures weight takes precedence, and within same weight, recent notifications rank higher
 */
function calculatePriorityScore(notification, baseTime) {
  const weight = PRIORITY_WEIGHTS[notification.Type] || 0;
  const notificationTime = new Date(notification.Timestamp).getTime();
  const timeDiffMs = baseTime - notificationTime;
  
  // Recency score: newer notifications get higher score (lower time diff)
  // Using exponential decay so recent notifications are significantly ranked higher
  const recencyScore = Math.max(0, 1000 - (timeDiffMs / 1000)); // 1000 - seconds elapsed
  
  return weight * 1000 + recencyScore;
}

/**
 * Fetch notifications from the API with pagination and filtering
 */
async function fetchNotifications(limit = 100, page = 1, notificationType = null) {
  try {
    const params = {
      limit,
      page
    };

    if (notificationType) {
      params.notification_type = notificationType;
    }

    const response = await axios.get(NOTIFICATION_API_URL, {
      params,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.notifications || [];
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    throw new Error('Failed to fetch notifications from API');
  }
}

/**
 * Get top N priority notifications
 * Fetches notifications, sorts by priority (weight + recency), and returns top N
 */
async function getTopPriorityNotifications(topN = 10, notificationType = null) {
  try {
    // Fetch all available notifications (with pagination if needed)
    const notifications = await fetchNotifications(100, 1, notificationType);

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return [];
    }

    const baseTime = new Date().getTime();

    // Calculate priority score for each notification
    const scoredNotifications = notifications.map(notification => ({
      ...notification,
      priorityScore: calculatePriorityScore(notification, baseTime),
      priorityRank: 0
    }));

    // Sort by priority score (descending)
    const sortedNotifications = scoredNotifications.sort(
      (a, b) => b.priorityScore - a.priorityScore
    );

    // Assign ranks
    sortedNotifications.forEach((notif, index) => {
      notif.priorityRank = index + 1;
    });

    // Return top N
    return sortedNotifications.slice(0, topN);
  } catch (error) {
    console.error('Error getting top priority notifications:', error.message);
    throw error;
  }
}

/**
 * Get all notifications with their priority scores
 * Useful for displaying all notifications with priority indicators
 */
async function getAllNotificationsWithPriority(notificationType = null) {
  try {
    const notifications = await fetchNotifications(100, 1, notificationType);

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return [];
    }

    const baseTime = new Date().getTime();

    const scoredNotifications = notifications.map((notification, index) => ({
      ...notification,
      priorityScore: calculatePriorityScore(notification, baseTime),
      priorityRank: index + 1,
      isRead: false // Frontend will track this
    }));

    return scoredNotifications.sort(
      (a, b) => b.priorityScore - a.priorityScore
    );
  } catch (error) {
    console.error('Error getting all notifications with priority:', error.message);
    throw error;
  }
}

module.exports = {
  fetchNotifications,
  getTopPriorityNotifications,
  getAllNotificationsWithPriority,
  calculatePriorityScore,
  PRIORITY_WEIGHTS
};
