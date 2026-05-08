const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');

/**
 * GET /api/notifications/priority
 * Get top N priority notifications
 * Query params:
 * - limit: number of top notifications to return (default 10)
 * - notification_type: filter by type (Event, Result, Placement)
 */
router.get('/priority', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const notificationType = req.query.notification_type || null;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Invalid limit. Must be between 1 and 100.'
      });
    }

    const priorityNotifications = await notificationService.getTopPriorityNotifications(
      limit,
      notificationType
    );

    res.json({
      success: true,
      count: priorityNotifications.length,
      limit,
      notifications: priorityNotifications
    });
  } catch (error) {
    console.error('Error in /priority route:', error);
    res.status(500).json({
      error: 'Failed to fetch priority notifications',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/all
 * Get all notifications with priority scores
 * Query params:
 * - notification_type: filter by type (Event, Result, Placement)
 */
router.get('/all', async (req, res) => {
  try {
    const notificationType = req.query.notification_type || null;

    const allNotifications = await notificationService.getAllNotificationsWithPriority(
      notificationType
    );

    res.json({
      success: true,
      count: allNotifications.length,
      notifications: allNotifications
    });
  } catch (error) {
    console.error('Error in /all route:', error);
    res.status(500).json({
      error: 'Failed to fetch all notifications',
      message: error.message
    });
  }
});

module.exports = router;
