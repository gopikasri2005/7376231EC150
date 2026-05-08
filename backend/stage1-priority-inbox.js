#!/usr/bin/env node

/**
 * Stage 1: Priority Inbox Implementation
 * This script fetches notifications from the API and displays top 10 priority notifications
 * Priority is determined by: weight (Placement > Result > Event) and recency
 */

const axios = require('axios');

const NOTIFICATION_API_URL = 'http://4.224.186.213/evaluation-service/notifications';
const AUTH_TOKEN = 'your_auth_token_here'; // Add your auth token

const PRIORITY_WEIGHTS = {
  'Placement': 3,
  'Result': 2,
  'Event': 1
};

/**
 * Calculate priority score
 */
function calculatePriorityScore(notification, baseTime) {
  const weight = PRIORITY_WEIGHTS[notification.Type] || 0;
  const notificationTime = new Date(notification.Timestamp).getTime();
  const timeDiffMs = baseTime - notificationTime;
  const recencyScore = Math.max(0, 1000 - (timeDiffMs / 1000));
  return weight * 1000 + recencyScore;
}

/**
 * Main function to fetch and display priority notifications
 */
async function main() {
  try {
    console.log('='.repeat(80));
    console.log('PRIORITY INBOX - TOP 10 NOTIFICATIONS');
    console.log('='.repeat(80));
    console.log('\nFetching notifications from API...\n');

    // Fetch notifications
    const response = await axios.get(NOTIFICATION_API_URL, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const notifications = response.data.notifications || [];

    if (notifications.length === 0) {
      console.log('No notifications found.');
      return;
    }

    const baseTime = new Date().getTime();

    // Calculate priority scores and sort
    const scoredNotifications = notifications.map((notif, index) => ({
      ...notif,
      priorityScore: calculatePriorityScore(notif, baseTime),
      originalIndex: index
    }));

    const sortedNotifications = scoredNotifications.sort(
      (a, b) => b.priorityScore - a.priorityScore
    );

    // Display results
    console.log(`Total Notifications: ${notifications.length}`);
    console.log(`Displaying: Top 10 Priority Notifications\n`);
    console.log('-'.repeat(80));

    sortedNotifications.slice(0, 10).forEach((notif, index) => {
      const typeColor = notif.Type === 'Placement' ? '\x1b[32m' : 
                        notif.Type === 'Result' ? '\x1b[33m' : '\x1b[36m';
      const reset = '\x1b[0m';

      console.log(`\n${index + 1}. ${typeColor}[${notif.Type}]${reset}`);
      console.log(`   ID: ${notif.ID}`);
      console.log(`   Message: ${notif.Message}`);
      console.log(`   Timestamp: ${notif.Timestamp}`);
      console.log(`   Priority Score: ${notif.priorityScore.toFixed(2)}`);
    });

    console.log('\n' + '-'.repeat(80));
    console.log('\nPriority Calculation:');
    console.log('• Placement: Weight 3 (highest priority)');
    console.log('• Result: Weight 2 (medium priority)');
    console.log('• Event: Weight 1 (lower priority)');
    console.log('• Recency: More recent = higher score within same weight\n');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the script
main();
