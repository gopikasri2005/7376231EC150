import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Typography,
  Paper,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { fetchNotifications } from './notificationService';

const notificationTypes = ['', 'Event', 'Result', 'Placement'];
const STORAGE_KEY = 'viewedNotifications';

function buildViewedStorage(initial = []) {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return new Set(initial);
  }
  try {
    return new Set(JSON.parse(stored));
  } catch {
    return new Set(initial);
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [notificationType, setNotificationType] = useState('');
  const [viewed, setViewed] = useState(() => buildViewedStorage());

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetchNotifications({ limit, page, notificationType })
      .then((data) => {
        if (active) {
          setNotifications(data);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Unable to load notifications');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [limit, page, notificationType]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !viewed.has(notification.ID)).length,
    [notifications, viewed]
  );

  const markViewed = (id) => {
    const next = new Set(viewed);
    next.add(id);
    setViewed(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  };

  return (
    <Box>
      <Stack spacing={3}>
        {/* Header */}
        <Paper elevation={0} sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            All Notifications
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Complete list of notifications from the API with pagination and type filtering
          </Typography>
        </Paper>

        {/* Top Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Chip 
            label={`Unread: ${unreadCount}`} 
            color="primary" 
            variant="filled"
            sx={{ px: 1 }}
          />
          <Button 
            variant="contained" 
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        {/* Filters */}
        <Paper elevation={0} sx={{ p: 2, background: '#f5f5f5', borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Notification Type</InputLabel>
                <Select
                  value={notificationType}
                  label="Notification Type"
                  onChange={(event) => {
                    setNotificationType(event.target.value);
                    setPage(1);
                  }}
                >
                  {notificationTypes.map((type) => (
                    <MenuItem key={type || 'all'} value={type}>
                      {type || 'All types'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Items per page</InputLabel>
                <Select 
                  value={limit} 
                  label="Items per page" 
                  onChange={(event) => setLimit(Number(event.target.value))}
                >
                  {[10, 20, 50].map((value) => (
                    <MenuItem key={value} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Error */}
        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

        {/* Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Alert severity="info">No notifications available. Try adjusting your filters.</Alert>
        ) : (
          <Stack spacing={2}>
            {notifications.map((notification) => {
              const isNew = !viewed.has(notification.ID);
              const typeClass = notification.Type.toLowerCase();
              return (
                <Card
                  key={notification.ID}
                  className={`notification-card ${typeClass}`}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                    },
                    opacity: isNew ? 1 : 0.8,
                  }}
                  onClick={() => markViewed(notification.ID)}
                >
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={notification.Type}
                          size="small"
                          variant="outlined"
                          color={notification.Type === 'Placement' ? 'success' : notification.Type === 'Result' ? 'warning' : 'info'}
                        />
                      </Box>
                      {isNew && (
                        <Chip
                          label="NEW"
                          color="error"
                          size="small"
                          className="new-badge"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                      {notification.Message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.Timestamp).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontFamily: 'monospace' }}>
                      ID: {notification.ID}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}

        {/* Pagination */}
        {!loading && notifications.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
            <Pagination count={5} page={page} onChange={(_, value) => setPage(value)} color="primary" />
          </Box>
        )}
      </Stack>
    </Box>
  );
}
