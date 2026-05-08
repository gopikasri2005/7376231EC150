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
  Select,
  Slider,
  Stack,
  Typography,
  Paper,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { fetchNotifications } from './notificationService';
import { selectTopNotifications } from './priorityUtils';

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

export default function PriorityInboxPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notificationType, setNotificationType] = useState('');
  const [topN, setTopN] = useState(10);
  const [viewed, setViewed] = useState(() => buildViewedStorage());

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetchNotifications({ limit: 100, page: 1, notificationType })
      .then((data) => {
        if (active) {
          setNotifications(data);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Unable to load priority notifications');
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
  }, [notificationType]);

  const priorityNotifications = useMemo(
    () => selectTopNotifications(notifications, topN),
    [notifications, topN]
  );

  const unreadCount = useMemo(
    () => priorityNotifications.filter((notification) => !viewed.has(notification.ID)).length,
    [priorityNotifications, viewed]
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
        {/* Header with Trophy Icon */}
        <Paper elevation={0} sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white', 
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <EmojiEventsIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, m: 0 }}>
                Priority Inbox
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, m: 0 }}>
                Your top {topN} most important notifications
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Top Control Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={`Unread: ${unreadCount}`} 
              color="error" 
              variant="filled"
              sx={{ px: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              of top {topN}
            </Typography>
          </Box>
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
        <Paper elevation={0} sx={{ p: 2.5, background: '#f5f5f5', borderRadius: 2 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Type Filter</InputLabel>
                <Select
                  value={notificationType}
                  label="Type Filter"
                  onChange={(event) => setNotificationType(event.target.value)}
                >
                  {notificationTypes.map((type) => (
                    <MenuItem key={type || 'all'} value={type}>
                      {type || 'All types'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <Box sx={{ px: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Top notifications to display
                  </Typography>
                  <Chip 
                    label={topN} 
                    size="small" 
                    variant="filled"
                    color="primary"
                    sx={{ minWidth: 40 }}
                  />
                </Box>
                <Slider
                  min={5}
                  max={20}
                  step={5}
                  value={topN}
                  onChange={(_, value) => setTopN(value)}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 5, label: '5' },
                    { value: 10, label: '10' },
                    { value: 15, label: '15' },
                    { value: 20, label: '20' }
                  ]}
                  sx={{ mt: 2 }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Alert */}
        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

        {/* Notifications Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : priorityNotifications.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No priority notifications available at the moment. Check back soon!
          </Alert>
        ) : (
          <Stack spacing={2}>
            {priorityNotifications.map((notification, index) => {
              const isNew = !viewed.has(notification.ID);
              const typeClass = notification.Type.toLowerCase();
              const rankBgColor = 
                index === 0 ? '#FFD700' : // Gold
                index === 1 ? '#C0C0C0' : // Silver
                index === 2 ? '#CD7F32' : // Bronze
                '#E8EAF6'; // Default

              return (
                <Card
                  key={notification.ID}
                  className={`notification-card ${typeClass}`}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-4px)',
                    },
                    opacity: isNew ? 1 : 0.75,
                  }}
                  onClick={() => markViewed(notification.ID)}
                >
                  {/* Rank Badge */}
                  <Box
                    sx={{
                      background: rankBgColor,
                      color: index <= 2 ? '#000' : '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: 2,
                      minWidth: 50,
                      fontWeight: 'bold',
                      fontSize: '18px',
                    }}
                  >
                    #{index + 1}
                  </Box>

                  {/* Content */}
                  <CardContent sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 1,
                    flex: 1,
                    py: 2
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={notification.Type}
                          size="small"
                          variant="filled"
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
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {notification.Message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.Timestamp).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
