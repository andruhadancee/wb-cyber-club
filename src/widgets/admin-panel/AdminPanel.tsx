import { useState, useEffect, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Fab from '@mui/material/Fab';
import TextField from '@mui/material/TextField';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HistoryIcon from '@mui/icons-material/History';
import GroupsIcon from '@mui/icons-material/Groups';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import LinkIcon from '@mui/icons-material/Link';
import DescriptionIcon from '@mui/icons-material/Description';
import ShareIcon from '@mui/icons-material/Share';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useTournamentStore } from '@/entities/tournament/model';
import { useTeamStore, useBulkCreateTeams } from '@/entities/team/model';
import { useDisciplineStore } from '@/entities/discipline/model';
import { useCalendarStore } from '@/entities/calendar-event/model';
import { useRegulationStore } from '@/entities/regulation/model';
import { useBracketStore } from '@/entities/bracket/model';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { normalizeTimeToHHmm, formatDateForDisplay } from '@/shared/lib/date';
import { getDisciplineColor } from '@/shared/lib/discipline-colors';
import { DisciplineAvatar } from '@/shared/ui/discipline-avatar/DisciplineAvatar';
import { Modal } from '@/shared/ui/modal/Modal';
import { showSuccess, showError } from '@/shared/lib/toast';
import { showConfirm } from '@/shared/ui/confirm-dialog/ConfirmDialog';
import { TournamentForm } from '@/features/admin-forms/tournament-form/TournamentForm';
import { TeamForm } from '@/features/admin-forms/team-form/TeamForm';
import { BulkTeamForm } from '@/features/admin-forms/team-form/BulkTeamForm';
import { CalendarEventForm } from '@/features/admin-forms/calendar-form/CalendarEventForm';
import { RegulationForm } from '@/features/admin-forms/regulation-form/RegulationForm';
import { DisciplineForm } from '@/features/admin-forms/discipline-form/DisciplineForm';
import { LinksForm } from '@/features/admin-forms/links-form/LinksForm';
import { SocialForm } from '@/features/admin-forms/social-form/SocialForm';
import { DisciplineFilter } from '@/features/discipline-filter/DisciplineFilter';
import { CalendarGrid } from '@/widgets/calendar-grid/CalendarGrid';
import { BracketView } from '@/shared/ui/bracket/BracketView';
import { AdminBracketTab } from '@/features/admin-bracket/AdminBracketTab';
import type { Tournament } from '@/entities/tournament/types';
import type { Team } from '@/entities/team/types';
import type { CalendarEvent } from '@/entities/calendar-event/types';
import type { Regulation } from '@/entities/regulation/types';
import type { Discipline } from '@/entities/discipline/types';

const TAB_KEYS = ['active', 'past', 'teams', 'brackets', 'calendar', 'disciplines', 'links', 'regulations', 'social'] as const;
type TabName = (typeof TAB_KEYS)[number];

const TAB_CONFIG: Record<TabName, { label: string; icon: React.ReactElement }> = {
  active: { label: 'Активные', icon: <EmojiEventsIcon fontSize="small" /> },
  past: { label: 'Архив', icon: <HistoryIcon fontSize="small" /> },
  teams: { label: 'Команды', icon: <GroupsIcon fontSize="small" /> },
  brackets: { label: 'Сетки', icon: <AccountTreeIcon fontSize="small" /> },
  calendar: { label: 'Календарь', icon: <CalendarMonthIcon fontSize="small" /> },
  disciplines: { label: 'Дисциплины', icon: <SportsEsportsIcon fontSize="small" /> },
  links: { label: 'Ссылки', icon: <LinkIcon fontSize="small" /> },
  regulations: { label: 'Регламент', icon: <DescriptionIcon fontSize="small" /> },
  social: { label: 'Соцсети', icon: <ShareIcon fontSize="small" /> },
};

export function AdminPanel() {
  const savedTab = localStorage.getItem('adminActiveTab') as TabName | null;
  const [tab, setTab] = useState<TabName>(savedTab && TAB_KEYS.includes(savedTab) ? savedTab : 'active');
  const [filterActive, setFilterActive] = useState('all');
  const [filterPast, setFilterPast] = useState('all');
  const [filterTeams, setFilterTeams] = useState('all');
  const [filterCalendar, setFilterCalendar] = useState('all');
  const [searchActive, setSearchActive] = useState('');
  const [searchPast, setSearchPast] = useState('');

  // Track whether current form has unsaved changes
  const formDirtyRef = useRef(false);
  const isFormDirty = useCallback(() => formDirtyRef.current, []);
  const handleDirtyChange = useCallback((dirty: boolean) => { formDirtyRef.current = dirty; }, []);

  // New discipline form
  const [newDisciplineName, setNewDisciplineName] = useState('');
  const [newDisciplineColor, setNewDisciplineColor] = useState('#8b5abf');

  // Modal states
  const [tournamentModal, setTournamentModal] = useState<{ open: boolean; tournament?: Tournament; isPast?: boolean }>({ open: false });
  const [teamModal, setTeamModal] = useState<{ open: boolean; team?: Team }>({ open: false });
  const [calendarModal, setCalendarModal] = useState<{ open: boolean; event?: CalendarEvent; defaultDate?: string }>({ open: false });
  const [regulationModal, setRegulationModal] = useState<{ open: boolean; regulation?: Regulation }>({ open: false });
  const [disciplineModal, setDisciplineModal] = useState<{ open: boolean; discipline?: Discipline }>({ open: false });
  const [bulkTeamModal, setBulkTeamModal] = useState(false);

  // Stores
  const tournamentStore = useTournamentStore();
  const teamStore = useTeamStore();
  const disciplineStore = useDisciplineStore();
  const calendarStore = useCalendarStore();
  const regulationStore = useRegulationStore();
  const bulkCreateMut = useBulkCreateTeams();

  const handleTabChange = useCallback((_: unknown, value: number) => {
    const key = TAB_KEYS[value];
    setTab(key);
    localStorage.setItem('adminActiveTab', key);
  }, []);


  // ─── Handlers ───

  const handleArchive = (t: Tournament) => {
    showConfirm({
      message: `Перенести "${t.title}" в архив?`,
      confirmLabel: 'В архив',
      onConfirm: async () => {
        try {
          await tournamentStore.updateTournament({
            id: t.id, title: t.title, disciplineId: t.discipline_id, date: t.date,
            prize: t.prize, maxTeams: t.max_teams, customLink: t.custom_link,
            status: 'finished', winner: t.winner, winner2nd: t.winner_2nd, winner3rd: t.winner_3rd,
            watchUrl: t.watch_url, startTime: normalizeTimeToHHmm(t.start_time),
          });
          showSuccess('Турнир перенесён в архив');
        } catch (e) {
          showError('Ошибка: ' + (e instanceof Error ? e.message : e));
        }
      },
    });
  };

  const handleDeleteTournament = (id: number) => {
    showConfirm({
      message: 'Удалить турнир?',
      onConfirm: async () => {
        try {
          await tournamentStore.removeTournament(id);
          showSuccess('Турнир удалён');
        } catch (e) {
          showError('Ошибка: ' + (e instanceof Error ? e.message : e));
        }
      },
    });
  };

  const handleDeleteTeam = (id: number) => {
    showConfirm({
      message: 'Удалить команду?',
      onConfirm: async () => {
        try {
          await teamStore.removeTeam(id);
          showSuccess('Команда удалена');
        } catch (e) {
          showError('Ошибка: ' + (e instanceof Error ? e.message : e));
        }
      },
    });
  };

  const handleDeleteAllTeams = (tournamentId: number, tournamentTitle: string) => {
    showConfirm({
      message: `Удалить все команды турнира «${tournamentTitle}»?`,
      onConfirm: async () => {
        try {
          await teamStore.removeByTournament(tournamentId);
          showSuccess('Все команды удалены');
        } catch (e) {
          showError('Ошибка: ' + (e instanceof Error ? e.message : e));
        }
      },
    });
  };

  const handleAddDiscipline = async () => {
    if (!newDisciplineName.trim()) {
      showError('Введите название дисциплины');
      return;
    }
    try {
      await disciplineStore.createDiscipline(newDisciplineName.trim(), newDisciplineColor);
      showSuccess(`Дисциплина "${newDisciplineName}" добавлена`);
      setNewDisciplineName('');
    } catch (e) {
      showError('Ошибка: ' + (e instanceof Error ? e.message : e));
    }
  };

  const handleDeleteDiscipline = (id: number, name: string) => {
    showConfirm({
      message: `Удалить дисциплину "${name}"?`,
      onConfirm: async () => {
        try {
          await disciplineStore.removeDiscipline(id);
          showSuccess(`Дисциплина "${name}" удалена`);
        } catch (e) {
          showError('Ошибка: ' + (e instanceof Error ? e.message : e));
        }
      },
    });
  };

  const handleDeleteRegulation = (id: number) => {
    showConfirm({
      message: 'Удалить регламент?',
      onConfirm: async () => {
        try {
          await regulationStore.removeRegulation(id);
          showSuccess('Регламент удалён');
        } catch (e) {
          showError('Ошибка: ' + (e instanceof Error ? e.message : e));
        }
      },
    });
  };

  // ─── Form submit handlers ───

  const handleTournamentSubmit = async (data: any) => {
    try {
      if (data.id) {
        await tournamentStore.updateTournament(data);
        showSuccess('Турнир обновлён');
      } else {
        await tournamentStore.createTournament(data);
        showSuccess('Турнир добавлен');
      }
      setTournamentModal({ open: false });
    } catch (e) {
      showError('Ошибка: ' + (e instanceof Error ? e.message : e));
    }
  };

  const handleTeamSubmit = async (data: any) => {
    try {
      if (data.id) {
        await teamStore.updateTeam(data);
        showSuccess('Команда обновлена');
      } else {
        await teamStore.createTeam(data);
        showSuccess('Команда добавлена');
      }
      setTeamModal({ open: false });
    } catch (e) {
      showError('Ошибка: ' + (e instanceof Error ? e.message : e));
    }
  };

  const handleBulkTeamSubmit = async (data: { tournamentId: number; names: string[]; players: number }) => {
    try {
      const result = await bulkCreateMut.mutateAsync(data);
      showSuccess(`Добавлено ${result.created} команд / игроков`);
      setBulkTeamModal(false);
    } catch (e) {
      showError('Ошибка: ' + (e instanceof Error ? e.message : e));
    }
  };

  const handleCalendarSubmit = async (data: any) => {
    try {
      if (data.id) {
        await calendarStore.updateEvent(data);
        showSuccess('Событие обновлено');
      } else {
        await calendarStore.createEvent(data);
        showSuccess('Событие добавлено');
      }
      setCalendarModal({ open: false });
    } catch (e) {
      showError('Ошибка: ' + (e instanceof Error ? e.message : e));
    }
  };

  const handleRegulationSubmit = async (data: any) => {
    try {
      if (data.id) {
        await regulationStore.updateRegulation(data.id, data);
        showSuccess('Регламент обновлён');
      } else {
        await regulationStore.createRegulation(data);
        showSuccess('Регламент добавлен');
      }
      setRegulationModal({ open: false });
    } catch (e) {
      showError('Ошибка: ' + (e instanceof Error ? e.message : e));
    }
  };

  const handleDisciplineSubmit = async (data: any) => {
    try {
      if (data.id) {
        await disciplineStore.updateDiscipline(data.id, { name: data.name, color: data.color, logo_url: data.logo_url });
        showSuccess('Дисциплина обновлена');
      }
      setDisciplineModal({ open: false });
    } catch (e) {
      showError('Ошибка: ' + (e instanceof Error ? e.message : e));
    }
  };

  // ─── Tab renderers ───

  const renderTournamentTable = (tournaments: Tournament[], isPast: boolean) => {
    const filter = isPast ? filterPast : filterActive;
    const setFilter = isPast ? setFilterPast : setFilterActive;
    const search = isPast ? searchPast : searchActive;
    const setSearch = isPast ? setSearchPast : setSearchActive;
    const available = [...new Set(tournaments.map((t) => t.discipline))];
    const colorsMap = disciplineStore.colorsMap;

    const filtered = tournaments.filter((t) => {
      if (filter !== 'all' && t.discipline !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.title.toLowerCase().includes(q)
          || t.discipline.toLowerCase().includes(q)
          || (t.winner?.toLowerCase().includes(q) ?? false)
          || (t.winner_2nd?.toLowerCase().includes(q) ?? false)
          || (t.winner_3rd?.toLowerCase().includes(q) ?? false)
          || t.prize.toLowerCase().includes(q);
      }
      return true;
    });

    return (
      <>
        {/* Toolbar: search + filter + add button */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
          <TextField
            placeholder="Поиск по названию, дисциплине, призу…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: '100%', sm: 280 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          <DisciplineFilter selected={filter} onSelect={setFilter} availableDisciplines={available} />
          <Box sx={{ flex: 1 }} />
          <Chip label={`${filtered.length} из ${tournaments.length}`} variant="outlined" />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setTournamentModal({ open: true, isPast })}
          >
            {isPast ? 'Добавить прошедший' : 'Добавить турнир'}
          </Button>
        </Box>

        {filtered.length === 0 ? (
          <Paper variant="outlined" sx={{ borderRadius: 3, py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {search ? 'Ничего не найдено' : 'Нет турниров'}
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{
                  '& th': {
                    fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.04em',
                    textTransform: 'uppercase', color: 'text.secondary',
                    py: 1.5, whiteSpace: 'nowrap',
                  },
                }}>
                  <TableCell>Название</TableCell>
                  <TableCell>Дисциплина</TableCell>
                  <TableCell>Дата</TableCell>
                  <TableCell>Приз</TableCell>
                  <TableCell align="center">Команд</TableCell>
                  {isPast && <TableCell>Победитель</TableCell>}
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((t) => {
                  const discColor = getDisciplineColor(t.discipline, t.discipline_color ?? colorsMap[t.discipline]);
                  const time = normalizeTimeToHHmm(t.start_time);
                  return (
                    <TableRow
                      key={t.id}
                      hover
                      sx={{
                        '& td': { py: 1.5, fontSize: '0.875rem' },
                        cursor: 'pointer',
                        '&:last-child td': { borderBottom: 0 },
                      }}
                      onClick={() => setTournamentModal({ open: true, tournament: t, isPast })}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t.discipline}
                          sx={{
                            bgcolor: alpha(discColor, 0.12),
                            color: discColor,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 24,
                            borderRadius: '6px',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{formatDateForDisplay(t.date)}</Typography>
                          {time && (
                            <Typography variant="caption" color="text.secondary">{time} МСК</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                          {t.prize}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={isPast ? String(t.teams || 0) : `${t.teams || 0}/${t.max_teams}`}
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24, minWidth: 48 }}
                        />
                      </TableCell>
                      {isPast && (
                        <TableCell>
                          {(t.winner || t.winner_2nd || t.winner_3rd) ? (
                            <Stack spacing={0.25}>
                              {t.winner && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <EmojiEventsIcon sx={{ fontSize: 16, color: '#fbbf24' }} />
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#fbbf24' }}>
                                    {t.winner}
                                  </Typography>
                                </Box>
                              )}
                              {t.winner_2nd && (
                                <Typography variant="caption" color="text.secondary">
                                  2-е: {t.winner_2nd}
                                </Typography>
                              )}
                              {t.winner_3rd && (
                                <Typography variant="caption" color="text.secondary">
                                  3-е: {t.winner_3rd}
                                </Typography>
                              )}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                      )}
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Редактировать">
                            <IconButton onClick={() => setTournamentModal({ open: true, tournament: t, isPast })}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {!isPast && (
                            <Tooltip title="В архив">
                              <IconButton onClick={() => handleArchive(t)} color="warning">
                                <ArchiveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Удалить">
                            <IconButton onClick={() => handleDeleteTournament(t.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </>
    );
  };

  const renderTeams = () => {
    const data = Object.entries(teamStore.teamsByTournament);

    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Команды</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<ContentPasteGoIcon />} onClick={() => setBulkTeamModal(true)}>
              Массовое добавление
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setTeamModal({ open: true })}>
              Добавить команду
            </Button>
          </Box>
        </Box>
        {data.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Пока нет команд
          </Typography>
        ) : (
          data.map(([tid, teams]) => {
            const t = tournamentStore.activeTournaments.find((x) => String(x.id) === tid);
            return (
              <Paper key={tid} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography fontWeight={600}>
                    {t?.title || `Турнир #${tid}`} — {t?.discipline || ''}
                  </Typography>
                  <Tooltip title="Удалить все команды">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteAllTeams(Number(tid), t?.title || `Турнир #${tid}`)}
                    >
                      <DeleteSweepIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Команда</TableCell>
                        <TableCell align="right">Игроков</TableCell>
                        <TableCell align="right">Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teams.map((team) => (
                        <TableRow key={team.id} hover>
                          <TableCell>{team.name}</TableCell>
                          <TableCell align="right">{team.players}</TableCell>
                          <TableCell align="right">
                            <IconButton onClick={() => setTeamModal({ open: true, team })}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton onClick={() => handleDeleteTeam(team.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            );
          })
        )}
      </>
    );
  };

  const handleCalendarAddEvent = useCallback((dateStr: string) => {
    setCalendarModal({ open: true, defaultDate: dateStr });
  }, []);

  const handleCalendarEditEvent = useCallback((event: CalendarEvent) => {
    setCalendarModal({ open: true, event });
  }, []);

  const handleCalendarDeleteEvent = useCallback((event: CalendarEvent) => {
    showConfirm({
      title: 'Удалить событие',
      message: `Вы уверены, что хотите удалить "${event.title}"?`,
      onConfirm: async () => {
        try {
          await calendarStore.removeEvent(event.id);
          showSuccess('Событие удалено');
        } catch (e) {
          showError('Ошибка: ' + (e instanceof Error ? e.message : e));
        }
      },
    });
  }, [calendarStore]);

  const renderCalendar = () => (
    <>
      <DisciplineFilter selected={filterCalendar} onSelect={setFilterCalendar} colored />
      <CalendarGrid
        events={calendarStore.events}
        currentDate={calendarStore.currentDate}
        selectedDiscipline={filterCalendar}
        disciplines={disciplineStore.disciplines}
        colorsMap={disciplineStore.colorsMap}
        onPrevMonth={() => { calendarStore.prevMonth(); }}
        onNextMonth={() => { calendarStore.nextMonth(); }}
        onAddEvent={handleCalendarAddEvent}
        onEditEvent={handleCalendarEditEvent}
        onDeleteEvent={handleCalendarDeleteEvent}
      />
    </>
  );

  const renderDisciplines = () => (
    <>
      <Typography variant="h6" gutterBottom>
        Управление дисциплинами
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', mb: 3, maxWidth: 500 }}>
        <TextField
          label="Новая дисциплина"
          value={newDisciplineName}
          onChange={(e) => setNewDisciplineName(e.target.value)}
          sx={{ flex: 1 }}
        />
        <input
          type="color"
          value={newDisciplineColor}
          onChange={(e) => setNewDisciplineColor(e.target.value)}
          style={{ width: 40, height: 36, cursor: 'pointer', border: 'none', borderRadius: 4 }}
        />
        <Button variant="contained" onClick={handleAddDiscipline}>
          Добавить
        </Button>
      </Box>
      <Stack spacing={1}>
        {disciplineStore.disciplines.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            Нет дисциплин. Добавьте первую дисциплину выше.
          </Typography>
        )}
        {disciplineStore.disciplines.map((d) => (
          <Paper key={d.id} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {d.logo_url ? (
              <DisciplineAvatar src={d.logo_url} alt={d.name} size={40} sx={{ borderRadius: 0.5 }} />
            ) : (
              <Box sx={{ width: 40, height: 40, borderRadius: 0.5, bgcolor: d.color || '#8b5abf', flexShrink: 0 }} />
            )}
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: d.color || '#8b5abf', flexShrink: 0, border: '1px solid', borderColor: 'divider' }} />
            <Typography sx={{ flex: 1 }}>{d.name}</Typography>
            <IconButton onClick={() => setDisciplineModal({ open: true, discipline: d })}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={() => handleDeleteDiscipline(d.id, d.name)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Paper>
        ))}
      </Stack>
    </>
  );

  const renderRegulations = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Регламенты</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setRegulationModal({ open: true })}>
          Добавить
        </Button>
      </Box>
      {regulationStore.regulations.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Нет регламентов
        </Typography>
      ) : (
        <Stack spacing={1}>
          {regulationStore.regulations.map((r) => (
            <Paper key={r.id} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ flex: 1 }}>
                {r.discipline_name}
                {r.regulation_name && <Typography component="span" color="text.secondary"> — {r.regulation_name}</Typography>}
              </Typography>
              <Button href={r.pdf_url} target="_blank" rel="noopener noreferrer">
                PDF
              </Button>
              <IconButton onClick={() => setRegulationModal({ open: true, regulation: r })}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={() => handleDeleteRegulation(r.id)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Paper>
          ))}
        </Stack>
      )}
    </>
  );

  const tabContent: Record<TabName, () => React.ReactNode> = {
    active: () => renderTournamentTable(tournamentStore.activeTournaments, false),
    past: () => renderTournamentTable(tournamentStore.pastTournaments, true),
    teams: renderTeams,
    brackets: () => (
      <AdminBracketTab
        tournaments={[...tournamentStore.activeTournaments, ...tournamentStore.pastTournaments]}
      />
    ),
    calendar: renderCalendar,
    disciplines: renderDisciplines,
    links: () => <LinksForm />,
    regulations: renderRegulations,
    social: () => <SocialForm />,
  };

  return (
    <>
      <Paper
        variant="outlined"
        sx={{ mb: 3, overflowX: 'auto', borderRadius: 3 }}
      >
        <Tabs
          value={TAB_KEYS.indexOf(tab)}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 52,
              gap: 0.75,
            },
          }}
        >
          {TAB_KEYS.map((key) => (
            <Tab
              key={key}
              label={TAB_CONFIG[key].label}
              icon={TAB_CONFIG[key].icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      <Box>{tabContent[tab]()}</Box>

      {/* Tournament Modal */}
      <Modal
        open={tournamentModal.open}
        onClose={() => setTournamentModal({ open: false })}
        title={tournamentModal.tournament ? 'Редактировать турнир' : (tournamentModal.isPast ? 'Добавить прошедший турнир' : 'Добавить турнир')}
        confirmClose={isFormDirty}
      >
        <TournamentForm
          key={tournamentModal.tournament?.id ?? 'new'}
          tournament={tournamentModal.tournament}
          isPast={tournamentModal.isPast}
          onSubmit={handleTournamentSubmit}
          onCancel={() => setTournamentModal({ open: false })}
          onDirtyChange={handleDirtyChange}
        />
      </Modal>

      {/* Team Modal */}
      <Modal
        open={teamModal.open}
        onClose={() => setTeamModal({ open: false })}
        title={teamModal.team ? 'Редактировать команду' : 'Добавить команду'}
        confirmClose={isFormDirty}
      >
        <TeamForm
          key={teamModal.team?.id ?? 'new'}
          team={teamModal.team}
          onSubmit={handleTeamSubmit}
          onCancel={() => setTeamModal({ open: false })}
          onDirtyChange={handleDirtyChange}
        />
      </Modal>

      {/* Bulk Team Modal */}
      <Modal
        open={bulkTeamModal}
        onClose={() => setBulkTeamModal(false)}
        title="Массовое добавление"
      >
        <BulkTeamForm
          onSubmit={handleBulkTeamSubmit}
          onCancel={() => setBulkTeamModal(false)}
        />
      </Modal>

      {/* Calendar Event Modal */}
      <Modal
        open={calendarModal.open}
        onClose={() => setCalendarModal({ open: false })}
        title={calendarModal.event ? 'Изменить событие' : 'Добавить событие'}
        confirmClose={isFormDirty}
      >
        <CalendarEventForm
          key={calendarModal.event?.id ?? 'new'}
          event={calendarModal.event}
          defaultDate={calendarModal.defaultDate}
          onSubmit={handleCalendarSubmit}
          onCancel={() => setCalendarModal({ open: false })}
          onDirtyChange={handleDirtyChange}
        />
      </Modal>

      {/* Regulation Modal */}
      <Modal
        open={regulationModal.open}
        onClose={() => setRegulationModal({ open: false })}
        title={regulationModal.regulation ? 'Редактировать регламент' : 'Добавить регламент'}
        confirmClose={isFormDirty}
      >
        <RegulationForm
          key={regulationModal.regulation?.id ?? 'new'}
          regulation={regulationModal.regulation}
          onSubmit={handleRegulationSubmit}
          onCancel={() => setRegulationModal({ open: false })}
          onDirtyChange={handleDirtyChange}
        />
      </Modal>

      {/* Discipline Edit Modal */}
      <Modal
        open={disciplineModal.open}
        onClose={() => setDisciplineModal({ open: false })}
        title="Редактировать дисциплину"
        confirmClose={isFormDirty}
      >
        <DisciplineForm
          key={disciplineModal.discipline?.id ?? 'new'}
          discipline={disciplineModal.discipline}
          onSubmit={handleDisciplineSubmit}
          onCancel={() => setDisciplineModal({ open: false })}
          onDirtyChange={handleDirtyChange}
        />
      </Modal>
    </>
  );
}
