import React from 'react';
import { useHabits } from '../../contexts/HabitsContext';
import { useGoals } from '../../contexts/GoalsContext';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Button,
  Container,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowForward as ArrowIcon,
  Timer as TimerIcon,
  CheckCircle as CheckIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import Todo from '../Todo/Todo';
import Pomodoro from '../Pomodoro/Pomodoro';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { getHabitsForToday, getCompletedHabitsForToday } = useHabits();
  const { getActiveGoals, getGoalStats } = useGoals();

  const habitsForToday = getHabitsForToday();
  const completedHabits = getCompletedHabitsForToday();
  const activeGoals = getActiveGoals();
  const habitsProgress = (completedHabits.length / (habitsForToday.length || 1)) * 100;

  // Calculate overall progress for active goals
  const goalsProgress = activeGoals.reduce((acc, goal) => {
    const stats = getGoalStats(goal);
    return acc + stats.progress;
  }, 0) / (activeGoals.length || 1);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            mb: 2
          }}
        >
          Personal Productivity Hub
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ 
            maxWidth: '600px', 
            margin: '0 auto',
            opacity: 0.8,
            letterSpacing: '0.02em'
          }}
        >
          Manage your tasks, habits, and time all in one place
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Stats Cards */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            {/* Habits Card */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  p: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.dark, 0.25)} 100%)`,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CheckIcon sx={{ fontSize: 24, color: theme.palette.primary.main, mr: 2 }} />
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Today's Habits
                  </Typography>
                  <Tooltip title="Add New Habit">
                    <IconButton 
                      component={Link} 
                      to="/habits"
                      sx={{ 
                        color: theme.palette.primary.main,
                        '&:hover': { transform: 'scale(1.1)' }
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={habitsProgress}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      mb: 2,
                      '& .MuiLinearProgress-bar': {
                        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`
                      }
                    }}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                    {completedHabits.length} of {habitsForToday.length} completed
                  </Typography>
                </Box>
              </Card>
            </Grid>

            {/* Goals Card */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  p: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.dark, 0.25)} 100%)`,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <FlagIcon sx={{ fontSize: 24, color: theme.palette.secondary.main, mr: 2 }} />
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Active Goals
                  </Typography>
                  <Tooltip title="View Goals">
                    <IconButton 
                      component={Link} 
                      to="/goals"
                      sx={{ 
                        color: theme.palette.secondary.main,
                        '&:hover': { transform: 'scale(1.1)' }
                      }}
                    >
                      <ArrowIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={goalsProgress * 100}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      mb: 2,
                      '& .MuiLinearProgress-bar': {
                        background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.success.main} 90%)`
                      }
                    }}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                    {activeGoals.length} active goals
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={7}>
          <Card 
            sx={{ 
              height: '100%',
              minHeight: 500,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`
            }}
          >
            <CardContent sx={{ height: '100%', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                  Todo List
                </Typography>
                <Tooltip title="View All Todos">
                  <IconButton 
                    component={Link} 
                    to="/todo"
                    sx={{ 
                      color: theme.palette.primary.main,
                      '&:hover': { transform: 'scale(1.1)' }
                    }}
                  >
                    <ArrowIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <Todo compact />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card 
            sx={{ 
              height: '100%',
              minHeight: 500,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`
            }}
          >
            <CardContent sx={{ height: '100%', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TimerIcon sx={{ fontSize: 24, color: theme.palette.success.main, mr: 2 }} />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Pomodoro Timer
                </Typography>
              </Box>
              <Pomodoro />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 