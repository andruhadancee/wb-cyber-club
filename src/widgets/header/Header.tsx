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
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TelegramIcon from '@mui/icons-material/Telegram';
import EmailIcon from '@mui/icons-material/Email';
import { useSocialLinkStore } from '@/entities/social-link/model';

function TwitchIcon(props: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
    </svg>
  );
}

function DiscordIcon(props: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

const NAV_ITEMS: { path: string; label: string; icon: React.ReactNode; end?: boolean }[] = [
  { path: '/', label: 'Турниры', icon: <EmojiEventsIcon fontSize="small" />, end: true },
  { path: '/teams', label: 'Команды', icon: <GroupsIcon fontSize="small" /> },
  { path: '/archive', label: 'Архив', icon: <ArchiveIcon fontSize="small" /> },
  { path: '/regulations', label: 'Регламент', icon: <DescriptionIcon fontSize="small" /> },
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

        {/* Social links */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          minWidth: { md: 120 },
          justifyContent: 'flex-end',
        }}>
          {links.telegram && (
            <SocialChip href={links.telegram} icon={<TelegramIcon sx={{ fontSize: 18 }} />} label="Telegram" color="#26A5E4" compact={isMobile} />
          )}
          {links.discord && (
            <SocialChip href={links.discord} icon={<DiscordIcon style={{ fontSize: 18 }} />} label="Discord" color="#5865F2" compact={isMobile} />
          )}
          {links.twitch && (
            <SocialChip href={links.twitch} icon={<TwitchIcon style={{ fontSize: 18 }} />} label="Twitch" color="#9146FF" compact={isMobile} />
          )}
          {links.contact && (
            <SocialChip href={links.contact} icon={<EmailIcon sx={{ fontSize: 18 }} />} label="Связаться" color="#4CAF50" compact={isMobile} />
          )}
        </Box>

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

        <Box sx={{ mt: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Divider sx={{ borderColor: alpha('#fff', 0.06), mb: 1 }} />
          {links.telegram && (
            <SocialChip href={links.telegram} icon={<TelegramIcon sx={{ fontSize: 18 }} />} label="Telegram" color="#26A5E4" fullWidth />
          )}
          {links.discord && (
            <SocialChip href={links.discord} icon={<DiscordIcon style={{ fontSize: 18 }} />} label="Discord" color="#5865F2" fullWidth />
          )}
          {links.twitch && (
            <SocialChip href={links.twitch} icon={<TwitchIcon style={{ fontSize: 18 }} />} label="Twitch" color="#9146FF" fullWidth />
          )}
          {links.contact && (
            <SocialChip href={links.contact} icon={<EmailIcon sx={{ fontSize: 18 }} />} label="Связаться с нами" color="#4CAF50" fullWidth />
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
});

interface SocialChipProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  compact?: boolean;
  fullWidth?: boolean;
}

function SocialChip({ href, icon, label, color, compact, fullWidth }: SocialChipProps) {
  return (
    <Chip
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      icon={icon as React.ReactElement}
      label={compact ? undefined : label}
      clickable
      variant="outlined"
      sx={{
        borderColor: alpha(color, 0.3),
        color: alpha(color, 0.8),
        fontWeight: 600,
        transition: 'all 0.2s ease',
        '& .MuiChip-icon': { color: 'inherit' },
        '&:hover': {
          borderColor: color,
          color,
          bgcolor: alpha(color, 0.08),
          transform: 'translateY(-1px)',
        },
        ...(compact && {
          '& .MuiChip-icon': { color: 'inherit', m: 0 },
          '& .MuiChip-label': { display: 'none' },
          justifyContent: 'center',
          px: 1,
        }),
        ...(fullWidth && { width: '100%' }),
      }}
    />
  );
}
