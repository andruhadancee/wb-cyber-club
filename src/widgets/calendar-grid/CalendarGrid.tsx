import { useMemo, useState, memo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import GroupsIcon from '@mui/icons-material/Groups';
import { alpha, useTheme } from '@mui/material/styles';
import { getDisciplineColor } from '@/shared/lib/discipline-colors';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';
import { formatLocalDate, normalizeTimeToHHmm } from '@/shared/lib/date';
import { useInterval } from '@/shared/hooks/useInterval';
import { Modal } from '@/shared/ui/modal/Modal';
import type { CalendarEvent } from '@/entities/calendar-event/types';
import type { Discipline } from '@/entities/discipline/types';

interface Props {
  events: CalendarEvent[];
  currentDate: Date;
  selectedDiscipline: string;
  disciplines: Discipline[];
  colorsMap: Record<string, string | null>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onAddEvent?: (dateStr: string) => void;
  onEditEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function deduplicateEvents(events: CalendarEvent[]): CalendarEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    const key = e.tournament_id
      ? `tournament_${e.tournament_id}`
      : `${e.title}_${e.event_date.slice(0, 10)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const CalendarGrid = memo(function CalendarGrid({
  events,
  currentDate,
  selectedDiscipline,
  disciplines,
  colorsMap,
  onPrevMonth,
  onNextMonth,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}: Props) {
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const theme = useTheme();
  useInterval(() => setTick((t) => t + 1), 60000);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const filteredEvents = useMemo(() => {
    let f = events;
    if (selectedDiscipline !== 'all') {
      f = f.filter((e) => e.discipline === selectedDiscipline);
    }
    return deduplicateEvents(f);
  }, [events, selectedDiscipline]);

  const allEventsDeduped = useMemo(() => deduplicateEvents(events), [events]);

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleString('ru-RU', { month: 'long' });
  const yearStr = currentDate.getFullYear();

  // Today
  const now = new Date();
  const todayStr = formatLocalDate(now.getFullYear(), now.getMonth(), now.getDate());

  // Total events count for this month
  const totalEventsThisMonth = filteredEvents.length;

  const modalEvents = useMemo(() => {
    if (!modalDate) return [];
    return allEventsDeduped.filter((e) => e.event_date.slice(0, 10) === modalDate);
  }, [modalDate, allEventsDeduped]);

  // Format modal date for display
  const modalDateFormatted = useMemo(() => {
    if (!modalDate) return '';
    const d = new Date(modalDate + 'T12:00:00');
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [modalDate]);


  return (
    <>
      {/* Month navigation */}
      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 3 },
          py: 1.5,
          mb: 2.5,
          borderRadius: 3,
        }}
      >
        <IconButton
          onClick={onPrevMonth}
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.15),
              transform: 'translateX(-2px)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={800} sx={{ textTransform: 'capitalize', lineHeight: 1.2 }}>
            {monthName}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {yearStr} &middot; {totalEventsThisMonth}{' '}
            {totalEventsThisMonth === 1 ? 'событие' : totalEventsThisMonth < 5 ? 'события' : 'событий'}
          </Typography>
        </Box>

        <IconButton
          onClick={onNextMonth}
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.15),
              transform: 'translateX(2px)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Paper>

      {/* Calendar grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: { xs: 0.5, md: 0.75 },
        }}
      >
        {/* Weekday headers */}
        {WEEKDAYS.map((w, idx) => {
          const isWeekend = idx >= 5;
          return (
            <Box
              key={w}
              sx={{
                textAlign: 'center',
                py: 1,
                borderRadius: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: '0.7rem',
                  color: isWeekend ? alpha(theme.palette.error.main, 0.6) : 'text.secondary',
                }}
              >
                {w}
              </Typography>
            </Box>
          );
        })}

        {/* Empty cells */}
        {Array.from({ length: startOffset }, (_, i) => (
          <Box key={`empty-${i}`} sx={{ minHeight: { xs: 48, md: 80 } }} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = formatLocalDate(year, month, day);
          const dayEvents = filteredEvents.filter((e) => e.event_date.slice(0, 10) === dateStr);
          const hasEvents = dayEvents.length > 0;
          const isToday = dateStr === todayStr;
          const dayOfWeek = (startOffset + i) % 7;
          const isWeekend = dayOfWeek >= 5;

          const uniqueDisciplines = [
            ...new Set(
              events
                .filter((e) => e.event_date.slice(0, 10) === dateStr && e.discipline)
                .map((e) => e.discipline!),
            ),
          ];

          const disciplineInfo = [...new Set(
            dayEvents.filter((e) => e.discipline).map((e) => e.discipline!),
          )].map((d) => {
            const ev = dayEvents.find((e) => e.discipline === d);
            return {
              name: d,
              color: getDisciplineColor(d, colorsMap[d]),
              iconUrl: getDisciplineIconUrl(d, ev?.discipline_logo_url),
            };
          });

          const isMultiDiscipline = disciplineInfo.length > 1;
          const gradientColors = disciplineInfo.map((di) => di.color);

          const accentColor =
            hasEvents && uniqueDisciplines.length === 1
              ? getDisciplineColor(uniqueDisciplines[0], colorsMap[uniqueDisciplines[0]])
              : theme.palette.primary.main;

          return (
            <Tooltip
              key={day}
              title={
                hasEvents
                  ? dayEvents.map((e) => e.title).join(', ')
                  : ''
              }
              arrow
              placement="top"
            >
              <Paper
                variant="outlined"
                onClick={() => setModalDate(dateStr)}
                sx={{
                  p: { xs: 0.5, md: 1 },
                  minHeight: { xs: 48, md: 80 },
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: isMultiDiscipline
                    ? 'transparent'
                    : hasEvents
                      ? alpha(accentColor, 0.35)
                      : 'divider',
                  borderWidth: isMultiDiscipline ? 2 : hasEvents ? 1.5 : 1,
                  transition: 'all 0.2s ease',
                  ...(isToday && !isMultiDiscipline && {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2,
                    boxShadow: `0 0 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                  }),
                  ...(isMultiDiscipline && {
                    background: `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}) padding-box, linear-gradient(135deg, ${gradientColors.join(', ')}) border-box`,
                    ...(isToday && {
                      boxShadow: `0 0 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }),
                  }),
                  '&:hover': {
                    bgcolor: hasEvents
                      ? alpha(accentColor, 0.06)
                      : alpha('#fff', 0.02),
                    ...(!isMultiDiscipline && {
                      borderColor: hasEvents
                        ? alpha(accentColor, 0.6)
                        : alpha(theme.palette.primary.main, 0.3),
                    }),
                    transform: 'scale(1.03)',
                    zIndex: 1,
                  },
                  ...(hasEvents && {
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background:
                        uniqueDisciplines.length > 1
                          ? `linear-gradient(90deg, ${uniqueDisciplines.map((d) => getDisciplineColor(d, colorsMap[d])).join(', ')})`
                          : accentColor,
                    },
                  }),
                }}
              >
                {/* Day number + discipline icons */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography
                    variant="caption"
                    fontWeight={isToday ? 800 : hasEvents ? 700 : 400}
                    sx={{
                      fontSize: { xs: '0.7rem', md: '0.82rem' },
                      color: isToday
                        ? 'primary.main'
                        : isWeekend
                          ? alpha(theme.palette.error.main, 0.5)
                          : 'text.primary',
                      ...(isToday && {
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }),
                    }}
                  >
                    {day}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {/* Discipline icons */}
                    {hasEvents && disciplineInfo.slice(0, 3).map((di) => (
                      di.iconUrl ? (
                        <Tooltip key={di.name} title={di.name} arrow placement="top">
                          <Box
                            component="img"
                            src={di.iconUrl}
                            alt={di.name}
                            sx={{
                              width: { xs: 14, md: 18 },
                              height: { xs: 14, md: 18 },
                              borderRadius: '50%',
                              border: `1.5px solid ${alpha(di.color, 0.5)}`,
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        </Tooltip>
                      ) : (
                        <Box
                          key={di.name}
                          sx={{
                            width: { xs: 10, md: 14 },
                            height: { xs: 10, md: 14 },
                            borderRadius: '50%',
                            bgcolor: alpha(di.color, 0.3),
                            border: `1.5px solid ${di.color}`,
                            flexShrink: 0,
                          }}
                        />
                      )
                    ))}

                    {/* Event count badge (desktop) */}
                    {hasEvents && dayEvents.length > 1 && (
                      <Box
                        sx={{
                          display: { xs: 'none', md: 'flex' },
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          bgcolor: alpha(accentColor, 0.2),
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          color: accentColor,
                        }}
                      >
                        {dayEvents.length}
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Event titles */}
                {hasEvents && (
                  <Stack spacing={0.25} sx={{ mt: 0.5, flex: 1 }}>
                    {dayEvents.slice(0, 2).map((e) => {
                      const evColor = e.discipline
                        ? getDisciplineColor(e.discipline, colorsMap[e.discipline ?? ''])
                        : theme.palette.primary.main;
                      const evIconUrl = e.discipline
                        ? getDisciplineIconUrl(e.discipline, e.discipline_logo_url)
                        : null;
                      return (
                        <Box
                          key={e.id}
                          sx={{
                            display: { xs: 'none', md: 'flex' },
                            alignItems: 'center',
                            gap: 0.5,
                            px: 0.5,
                            py: 0.15,
                            borderRadius: 0.75,
                            bgcolor: alpha(evColor, 0.1),
                            borderLeft: `2px solid ${evColor}`,
                          }}
                        >
                          {evIconUrl && (
                            <Box
                              component="img"
                              src={evIconUrl}
                              alt={e.discipline ?? ''}
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <Typography
                            variant="caption"
                            noWrap
                            sx={{
                              fontSize: '0.62rem',
                              color: evColor,
                              fontWeight: 600,
                            }}
                          >
                            {e.title}
                          </Typography>
                        </Box>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.58rem', pl: 0.5, display: { xs: 'none', md: 'block' } }}
                      >
                        +{dayEvents.length - 2} ещё
                      </Typography>
                    )}
                  </Stack>
                )}
              </Paper>
            </Tooltip>
          );
        })}
      </Box>

      {/* Event modal */}
      <Modal
        open={modalDate !== null}
        onClose={() => setModalDate(null)}
        title={modalDateFormatted}
        maxWidth="sm"
      >
        <Stack spacing={2}>
          {modalEvents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TodayIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
              <Typography color="text.secondary">На этот день пока ничего не запланировано.</Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: -0.5 }}>
                {modalEvents.length} {modalEvents.length === 1 ? 'событие' : 'событий'}
              </Typography>
              {modalEvents.map((e) => {
              const iconUrl = e.discipline
                  ? getDisciplineIconUrl(e.discipline, e.discipline_logo_url)
                  : null;
                const evColor = e.discipline
                  ? getDisciplineColor(e.discipline, colorsMap[e.discipline ?? ''])
                  : theme.palette.primary.main;

                return (
                  <Paper
                    key={e.id}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderLeft: `4px solid ${evColor}`,
                      borderRadius: 2,
                      position: 'relative',
                    }}
                  >
                    {!e.is_archived && (onEditEvent || onDeleteEvent) && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          display: 'flex',
                          gap: 0.5,
                        }}
                      >
                        {onEditEvent && (
                          <Tooltip title="Редактировать" arrow>
                            <IconButton
                              size="small"
                              onClick={() => {
                                onEditEvent(e);
                                setModalDate(null);
                              }}
                              sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                                },
                              }}
                            >
                              <EditIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDeleteEvent && (
                          <Tooltip title="Удалить" arrow>
                            <IconButton
                              size="small"
                              onClick={() => {
                                onDeleteEvent(e);
                                setModalDate(null);
                              }}
                              sx={{
                                bgcolor: alpha(theme.palette.error.main, 0.08),
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.error.main, 0.18),
                                },
                              }}
                            >
                              <DeleteOutlineIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    )}

                    {e.is_archived && (
                      <Chip
                        label="Завершён"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: alpha(theme.palette.text.secondary, 0.12),
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                    )}

                    {e.image_url && (
                      <Box
                        component="img"
                        src={e.image_url}
                        alt={e.title}
                        sx={{
                          width: '100%',
                          borderRadius: 1.5,
                          mb: 2,
                          maxHeight: 200,
                          objectFit: 'cover',
                        }}
                      />
                    )}

                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{
                        lineHeight: 1.3,
                        mb: 1,
                        pr: (onEditEvent || onDeleteEvent) ? 8 : 0,
                      }}
                    >
                      {e.title}
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                      {e.discipline && (
                        <Chip
                          label={e.discipline}
                          variant="outlined"
                          avatar={
                            iconUrl ? (
                              <Box
                                component="img"
                                src={iconUrl}
                                alt={e.discipline}
                                sx={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : undefined
                          }
                          sx={{ borderColor: alpha(evColor, 0.3) }}
                        />
                      )}
                      {e.start_time && (
                        <Chip
                          icon={<AccessTimeIcon />}
                          label={`${normalizeTimeToHHmm(e.start_time)} МСК`}
                          variant="outlined"
                        />
                      )}
                      {e.prize && (
                        <Chip
                          icon={<EmojiEventsIcon />}
                          label={e.prize}
                          variant="outlined"
                          sx={{ borderColor: alpha('#fbbf24', 0.3), color: '#fbbf24' }}
                        />
                      )}
                    </Stack>

                    {e.description && (
                      <>
                        <Divider sx={{ my: 1.5, opacity: 0.3 }} />
                        <Typography variant="body2" color="text.secondary">
                          {e.description}
                        </Typography>
                      </>
                    )}

                    {e.is_archived && (
                      <>
                        <Divider sx={{ my: 1.5, opacity: 0.3 }} />

                        {e.teams != null && e.teams > 0 && (
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                            <GroupsIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              Участников: {e.teams}
                            </Typography>
                          </Stack>
                        )}

                        {(e.winner || e.winner_2nd || e.winner_3rd) && (
                          <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                            {e.winner && (
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <MilitaryTechIcon fontSize="small" sx={{ color: '#fbbf24' }} />
                                <Typography variant="body2" fontWeight={700}>
                                  {e.winner}
                                </Typography>
                              </Stack>
                            )}
                            {e.winner_2nd && (
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <MilitaryTechIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                                <Typography variant="body2">
                                  {e.winner_2nd}
                                </Typography>
                              </Stack>
                            )}
                            {e.winner_3rd && (
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <MilitaryTechIcon fontSize="small" sx={{ color: '#b45309' }} />
                                <Typography variant="body2">
                                  {e.winner_3rd}
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                        )}

                        {e.watch_url && (
                          <Button
                            variant="outlined"
                            startIcon={<PlayArrowIcon />}
                            href={e.watch_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            fullWidth
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                              borderColor: alpha(evColor, 0.4),
                              color: evColor,
                              '&:hover': {
                                borderColor: evColor,
                                bgcolor: alpha(evColor, 0.08),
                              },
                            }}
                          >
                            Смотреть
                          </Button>
                        )}
                      </>
                    )}

                  </Paper>
                );
              })}
            </>
          )}

          {onAddEvent && modalDate && (
            <Button
              variant="outlined"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => {
                onAddEvent(modalDate);
                setModalDate(null);
              }}
              sx={{
                borderStyle: 'dashed',
                borderColor: alpha(theme.palette.primary.main, 0.3),
                color: theme.palette.primary.main,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                '&:hover': {
                  borderStyle: 'dashed',
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                },
              }}
            >
              Добавить событие
            </Button>
          )}
        </Stack>
      </Modal>
    </>
  );
});
