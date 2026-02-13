import { useEffect, useState, useCallback, memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import ArchiveIcon from '@mui/icons-material/Archive';
import GavelIcon from '@mui/icons-material/Gavel';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TelegramIcon from '@mui/icons-material/Telegram';
import { useSocialLinkStore } from '@/entities/social-link/model';

const NAV_ITEMS: { path: string; label: string; icon: React.ReactNode; end?: boolean }[] = [
  { path: '/', label: 'Турниры', icon: <EmojiEventsIcon fontSize="small" />, end: true },
  { path: '/teams', label: 'Команды', icon: <GroupsIcon fontSize="small" /> },
  { path: '/archive', label: 'Архив', icon: <ArchiveIcon fontSize="small" /> },
  { path: '/regulations', label: 'Регламент', icon: <GavelIcon fontSize="small" /> },
  { path: '/calendar', label: 'Календарь', icon: <CalendarMonthIcon fontSize="small" /> },
];

export const Header = memo(function Header() {
  const { links, fetchAll } = useSocialLinkStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // test
  const handleDrawerToggle = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const primaryGlow = alpha(theme.palette.primary.main, 0.4);

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar
        sx={{
          maxWidth: 1920,
          width: '100%',
          mx: 'auto',
          px: { xs: 2, md: 3 },
          minHeight: { xs: 56, md: 64 },
          gap: 1,
            justifyContent: 'space-between'
        }}
      >
        {/* Left: Logo */}
        <Box
          component={NavLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            flexShrink: 0,
            minWidth: { md: 120 },
            transition: 'all 0.3s ease',
            '&:hover': {
              filter: `drop-shadow(0 0 10px ${primaryGlow})`,
            },
          }}
        >
          <Box
            component="img"
            src="/images/cyberclub-logo.png"
            alt="WB Cyber Club"
            sx={{ height: { xs: 28, md: 32 } }}
          />
        </Box>

        {/* Center: Desktop nav */}
        {!isMobile && (
          <Box
            sx={{
              display: 'flex',
              gap: 0.25,
              bgcolor: alpha('#fff', 0.04),
              borderRadius: 2.5,
              p: 0.5,
              border: `1px solid ${alpha('#fff', 0.04)}`,
            }}
          >
            {NAV_ITEMS.map(({ path, label, icon, end }) => (
              <Box
                key={path}
                component={NavLink}
                to={path}
                end={end}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.75,
                  py: 0.75,
                  borderRadius: 2,
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  '& .nav-icon': {
                    transition: 'color 0.2s ease',
                    color: alpha('#fff', 0.3),
                    display: 'flex',
                  },
                  '&:hover': {
                    color: 'text.primary',
                    bgcolor: alpha('#fff', 0.06),
                    '& .nav-icon': { color: 'text.secondary' },
                  },
                  '&.active': {
                    color: '#fff',
                    fontWeight: 700,
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '& .nav-icon': { color: theme.palette.primary.light },
                  },
                }}
              >
                <Box className="nav-icon">{icon}</Box>
                {label}
              </Box>
            ))}
          </Box>
        )}

        {/* Right: Telegram + mobile menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { md: 120 }, justifyContent: 'flex-end' }}>
        {/* Telegram */}
        {links.telegram && (
          <Chip
            component="a"
            href={links.telegram}
            target="_blank"
            rel="noopener noreferrer"
            icon={<TelegramIcon sx={{ fontSize: 18 }} />}
            label={isMobile ? undefined : 'Telegram'}
            clickable
            variant="outlined"
            sx={{
              borderColor: alpha('#26A5E4', 0.3),
              color: alpha('#26A5E4', 0.8),
              fontWeight: 600,
              transition: 'all 0.2s ease',
              '& .MuiChip-icon': { color: 'inherit' },
              '&:hover': {
                borderColor: '#26A5E4',
                color: '#26A5E4',
                bgcolor: alpha('#26A5E4', 0.08),
                transform: 'translateY(-1px)',
              },
            }}
          />
        )}

        {/* Mobile menu button */}
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              color: 'text.primary',
              ml: 0.5,
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'scale(1.1)' },
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        </Box>
      </Toolbar>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        PaperProps={{
          sx: {
            width: 280,
            background: alpha('#111113', 0.95),
            backdropFilter: 'blur(20px)',
            borderLeft: `1px solid ${alpha('#fff', 0.06)}`,
          },
        }}
      >
        {/* Drawer header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box component="img" src="/images/cyberclub-logo.png" alt="" sx={{ height: 24 }} />
          </Box>
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary', transform: 'rotate(90deg)' },
              transition: 'all 0.3s ease',
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: alpha('#fff', 0.06) }} />

        {/* Nav items */}
        <List sx={{ pt: 1.5, px: 1 }}>
          {NAV_ITEMS.map(({ path, label, icon, end }) => (
            <ListItemButton
              key={path}
              component={NavLink}
              to={path}
              end={end}
              sx={{
                borderRadius: 2.5,
                mb: 0.5,
                py: 1.25,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha('#fff', 0.04),
                },
                '&.active': {
                  color: theme.palette.primary.light,
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
                  '& .MuiListItemIcon-root': { color: theme.palette.primary.light },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>{icon}</ListItemIcon>
              <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.92rem' }} />
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ mt: 'auto', p: 2 }}>
          <Divider sx={{ borderColor: alpha('#fff', 0.06), mb: 2 }} />
          {links.telegram && (
            <Chip
              component="a"
              href={links.telegram}
              target="_blank"
              rel="noopener noreferrer"
              icon={<TelegramIcon sx={{ fontSize: 18 }} />}
              label="Telegram"
              clickable
              variant="outlined"
              sx={{
                width: '100%',
                borderColor: alpha('#26A5E4', 0.3),
                color: alpha('#26A5E4', 0.8),
                fontWeight: 600,
                '& .MuiChip-icon': { color: 'inherit' },
                '&:hover': {
                  borderColor: '#26A5E4',
                  color: '#26A5E4',
                  bgcolor: alpha('#26A5E4', 0.08),
                },
              }}
            />
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
});
