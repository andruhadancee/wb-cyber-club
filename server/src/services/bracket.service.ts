import prisma from '../prisma';
import { AppError } from '../app-error';
import { cacheInvalidate } from '../cache';

// ── Types ──

type BracketSide = 'upper' | 'lower' | 'grand_final';
type BracketFormat = 'single' | 'double';

interface MatchCreate {
  tournament_id: number;
  round: number;
  position: number;
  bracket_side: string;
  team1_id: number | null;
  team1_name: string | null;
  team2_id: number | null;
  team2_name: string | null;
  winner_id: number | null;
  winner_name: string | null;
  status: string;
}

interface MatchRow {
  id: number;
  tournament_id: number;
  round: number;
  position: number;
  bracket_side: string;
  team1_id: number | null;
  team1_name: string | null;
  team2_id: number | null;
  team2_name: string | null;
  winner_id: number | null;
  winner_name: string | null;
  status: string;
  score1: number | null;
  score2: number | null;
}

// ── Helpers ──

function cacheKey(tid: number): string {
  return `route:/api/brackets?tournamentId=${tid}`;
}

async function invalidateCache(tid: number): Promise<void> {
  await cacheInvalidate(cacheKey(tid));
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function nextPow2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Standard bracket seeding order (0-based).
 * Ensures byes are distributed evenly across both halves.
 * For size=8 returns [0,7, 3,4, 1,6, 2,5] — pairs: (0v7),(3v4),(1v6),(2v5).
 */
function standardSeedOrder(size: number): number[] {
  const rounds = Math.log2(size);
  let seeds = [0, 1];
  for (let i = 0; i < rounds - 1; i++) {
    const next: number[] = [];
    const len = seeds.length * 2;
    for (const s of seeds) {
      next.push(s, len - 1 - s);
    }
    seeds = next;
  }
  return seeds;
}

function findMatch(
  matches: MatchRow[],
  side: BracketSide,
  round: number,
  position: number,
): MatchRow | undefined {
  return matches.find(
    (m) => m.bracket_side === side && m.round === round && m.position === position,
  );
}

// ── Public API ──

export async function getByTournament(tournamentId: number) {
  return prisma.bracketMatch.findMany({
    where: { tournament_id: tournamentId },
    orderBy: [{ bracket_side: 'asc' }, { round: 'asc' }, { position: 'asc' }],
  });
}

/**
 * Generate bracket. Supports 'single' and 'double' elimination.
 */
export async function generate(tournamentId: number, format: BracketFormat = 'single') {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) throw AppError.notFound('Турнир не найден');

  const teams = await prisma.registeredTeam.findMany({
    where: { tournament_id: tournamentId },
    select: { id: true, name: true },
  });

  const uniqueMap = new Map<number, { id: number; name: string }>();
  for (const t of teams) {
    if (!uniqueMap.has(t.id)) uniqueMap.set(t.id, t);
  }
  const uniqueTeams = Array.from(uniqueMap.values());

  const isEmptyBracket = uniqueTeams.length === 0;
  const teamCount = isEmptyBracket ? (tournament.teams || 0) : uniqueTeams.length;

  if (teamCount < 2) {
    throw AppError.badRequest(
      isEmptyBracket
        ? 'Укажите количество команд (поле "Участвовало команд") — минимум 2'
        : 'Для генерации сетки нужно минимум 2 уникальные команды',
    );
  }
  if (format === 'double' && teamCount < 3) {
    throw AppError.badRequest('Для двойного выбывания нужно минимум 3 команды');
  }

  await prisma.bracketMatch.deleteMany({ where: { tournament_id: tournamentId } });

  const shuffled = isEmptyBracket ? [] : shuffle([...uniqueTeams]);
  const size = nextPow2(teamCount);
  const ubRounds = Math.log2(size);

  const allMatches: MatchCreate[] = [];

  // ═════════ Upper Bracket ═════════
  // Round 1 — use standard seeding order so BYEs are distributed evenly.
  const r1Count = size / 2;
  const seedOrder = standardSeedOrder(size);

  for (let i = 0; i < r1Count; i++) {
    if (isEmptyBracket) {
      allMatches.push(emptyMatch(tournamentId, 1, i, 'upper'));
    } else {
      const seed1 = seedOrder[i * 2];
      const seed2 = seedOrder[i * 2 + 1];
      const t1 = shuffled[seed1] ?? null;
      const t2 = shuffled[seed2] ?? null;
      const isBye = !t1 || !t2;
      const winner = isBye ? (t1 || t2) : null;

      allMatches.push({
        tournament_id: tournamentId,
        round: 1,
        position: i,
        bracket_side: 'upper',
        team1_id: t1?.id ?? null,
        team1_name: t1?.name ?? null,
        team2_id: t2?.id ?? null,
        team2_name: t2?.name ?? null,
        winner_id: winner?.id ?? null,
        winner_name: winner?.name ?? null,
        status: isBye ? 'completed' : 'pending',
      });
    }
  }

  // UB rounds 2..n
  for (let r = 2; r <= ubRounds; r++) {
    const count = size / Math.pow(2, r);
    for (let p = 0; p < count; p++) {
      allMatches.push(emptyMatch(tournamentId, r, p, 'upper'));
    }
  }

  // ═════════ Lower Bracket (double only) ═════════
  if (format === 'double') {
    const lbRounds = 2 * (ubRounds - 1); // e.g. 8 teams → UB 3 rounds → LB 4 rounds

    // Build LB round structure: how many matches per round
    // Odd rounds (1, 3, 5): consolation — survivors play each other
    // Even rounds (2, 4, 6): drop-in — UB losers enter
    // LB R1: size/4 matches (UB R1 losers paired)
    let lbMatchCount = r1Count / 2; // LB R1 matches

    for (let lr = 1; lr <= lbRounds; lr++) {
      for (let p = 0; p < lbMatchCount; p++) {
        allMatches.push(emptyMatch(tournamentId, lr, p, 'lower'));
      }
      // After even rounds (drop-in), count stays same
      // After odd rounds (consolation), count halves
      if (lr % 2 === 1) {
        // Next is even (drop-in) — same count
      } else {
        // Next is odd (consolation) — halves
        lbMatchCount = Math.max(1, lbMatchCount / 2);
      }
    }

    // ═════════ Grand Final ═════════
    allMatches.push(emptyMatch(tournamentId, 1, 0, 'grand_final'));
  }

  await prisma.bracketMatch.createMany({ data: allMatches });

  if (!isEmptyBracket) {
    const created = await prisma.bracketMatch.findMany({
      where: { tournament_id: tournamentId },
      orderBy: [{ bracket_side: 'asc' }, { round: 'asc' }, { position: 'asc' }],
    }) as MatchRow[];

    await advanceByeWinners(created);
    await autoCompleteByes(tournamentId);
  }

  await invalidateCache(tournamentId);

  return prisma.bracketMatch.findMany({
    where: { tournament_id: tournamentId },
    orderBy: [{ bracket_side: 'asc' }, { round: 'asc' }, { position: 'asc' }],
  });
}

/**
 * Update match — all identification through IDs.
 */
export async function updateMatch(
  id: number,
  data: {
    team1Id?: number | null;
    team2Id?: number | null;
    winnerId?: number | null;
    score1?: number | null;
    score2?: number | null;
    status?: string;
  },
) {
  const match = await prisma.bracketMatch.findUnique({ where: { id } }) as MatchRow | null;
  if (!match) throw AppError.notFound('Матч не найден');

  const newTeam1Id = data.team1Id !== undefined ? data.team1Id : match.team1_id;
  const newTeam2Id = data.team2Id !== undefined ? data.team2Id : match.team2_id;

  if (newTeam1Id && newTeam2Id && newTeam1Id === newTeam2Id) {
    throw AppError.badRequest('Команда не может играть сама с собой');
  }

  // Auto-remove team from other matches ONLY when admin explicitly REASSIGNS a team
  // (i.e. data.team1Id/team2Id was sent AND differs from the current value)
  const teamIdsToClean: number[] = [];
  if (data.team1Id !== undefined && data.team1Id !== null && data.team1Id !== match.team1_id) {
    teamIdsToClean.push(data.team1Id);
  }
  if (data.team2Id !== undefined && data.team2Id !== null && data.team2Id !== match.team2_id) {
    teamIdsToClean.push(data.team2Id);
  }

  if (teamIdsToClean.length > 0) {
    const otherMatches = await prisma.bracketMatch.findMany({
      where: { tournament_id: match.tournament_id, id: { not: match.id } },
    });
    for (const tid of teamIdsToClean) {
      for (const other of otherMatches) {
        const clearData: Record<string, unknown> = {};
        if (other.team1_id === tid) { clearData.team1_id = null; clearData.team1_name = null; }
        if (other.team2_id === tid) { clearData.team2_id = null; clearData.team2_name = null; }
        if (other.winner_id === tid) { clearData.winner_id = null; clearData.winner_name = null; clearData.status = 'pending'; }
        if (Object.keys(clearData).length > 0) {
          await prisma.bracketMatch.update({ where: { id: other.id }, data: clearData });
        }
      }
    }
  }

  // Resolve team names from IDs
  const idsToResolve = new Set<number>();
  if (data.team1Id !== undefined && data.team1Id !== null) idsToResolve.add(data.team1Id);
  if (data.team2Id !== undefined && data.team2Id !== null) idsToResolve.add(data.team2Id);
  if (data.winnerId !== undefined && data.winnerId !== null) idsToResolve.add(data.winnerId);

  const teamMap = new Map<number, string>();
  if (idsToResolve.size > 0) {
    const resolved = await prisma.registeredTeam.findMany({
      where: { id: { in: Array.from(idsToResolve) } },
      select: { id: true, name: true },
    });
    for (const t of resolved) teamMap.set(t.id, t.name);
  }

  const updateData: Record<string, unknown> = {
    score1: data.score1 ?? match.score1,
    score2: data.score2 ?? match.score2,
    status: data.status ?? match.status,
    updated_at: new Date(),
  };

  if (data.team1Id !== undefined) {
    updateData.team1_id = data.team1Id;
    updateData.team1_name = data.team1Id ? (teamMap.get(data.team1Id) ?? null) : null;
  }
  if (data.team2Id !== undefined) {
    updateData.team2_id = data.team2Id;
    updateData.team2_name = data.team2Id ? (teamMap.get(data.team2Id) ?? null) : null;
  }
  if (data.winnerId !== undefined) {
    if (data.winnerId !== null) {
      const finalT1 = (updateData.team1_id ?? match.team1_id) as number | null;
      const finalT2 = (updateData.team2_id ?? match.team2_id) as number | null;
      if (data.winnerId !== finalT1 && data.winnerId !== finalT2) {
        throw AppError.badRequest('Победитель должен быть одной из команд матча');
      }
    }
    updateData.winner_id = data.winnerId;
    updateData.winner_name = data.winnerId ? (teamMap.get(data.winnerId) ?? null) : null;
  }

  // Before updating, rollback previously advanced teams if winner changes or match reopened
  const oldWinnerId = match.winner_id;
  const oldLoserId = match.team1_id === oldWinnerId ? match.team2_id : match.team1_id;
  const newStatus = (updateData.status ?? match.status) as string;
  const newWinnerId = (updateData.winner_id !== undefined ? updateData.winner_id : match.winner_id) as number | null;

  const winnerChanged = oldWinnerId && (newWinnerId !== oldWinnerId || newStatus !== 'completed');
  if (winnerChanged) {
    const allForRollback = await prisma.bracketMatch.findMany({
      where: { tournament_id: match.tournament_id },
    }) as MatchRow[];
    const isDouble = allForRollback.some((m) => m.bracket_side === 'lower');

    // Clear old winner from the next match slot it was advanced into
    await rollbackAdvancement(match, oldWinnerId!, allForRollback, isDouble);

    // If double elim UB match, also clear old loser from LB
    if (isDouble && oldLoserId && match.bracket_side === 'upper') {
      await rollbackLoserFromLB(match, oldLoserId, allForRollback);
    }
  }

  const updated = await prisma.bracketMatch.update({ where: { id }, data: updateData }) as MatchRow;

  // Auto-advance on completion
  if (updated.status === 'completed' && updated.winner_id) {
    const allMatches = await prisma.bracketMatch.findMany({
      where: { tournament_id: match.tournament_id },
    }) as MatchRow[];

    const isDouble = allMatches.some((m) => m.bracket_side === 'lower');
    await advanceWinner(updated, allMatches, isDouble);
  }

  // Always sweep for BYE scenarios after any change (including rollback / reopen)
  await autoCompleteByes(match.tournament_id);

  await invalidateCache(match.tournament_id);
  return updated;
}

export async function deleteByTournament(tournamentId: number): Promise<void> {
  await prisma.bracketMatch.deleteMany({ where: { tournament_id: tournamentId } });
  await invalidateCache(tournamentId);
}

// ═══════════════════ Internal Helpers ═══════════════════

function emptyMatch(tid: number, round: number, position: number, side: BracketSide): MatchCreate {
  return {
    tournament_id: tid,
    round,
    position,
    bracket_side: side,
    team1_id: null, team1_name: null,
    team2_id: null, team2_name: null,
    winner_id: null, winner_name: null,
    status: 'pending',
  };
}

/**
 * After generation, push UB R1 BYE winners into UB R2.
 * All cascading BYE auto-completion is handled by `autoCompleteByes`.
 */
async function advanceByeWinners(matches: MatchRow[]): Promise<void> {
  const ubR1Byes = matches.filter(
    (m) => m.bracket_side === 'upper' && m.round === 1 && m.status === 'completed' && m.winner_id,
  );
  const ubR2 = matches.filter((m) => m.bracket_side === 'upper' && m.round === 2);

  for (const bye of ubR1Byes) {
    const nextPos = Math.floor(bye.position / 2);
    const isSlot1 = bye.position % 2 === 0;
    const target = ubR2.find((m) => m.position === nextPos);
    if (target) {
      await setTeamInSlot(target.id, isSlot1, bye.winner_id!, bye.winner_name);
    }
  }
}

/**
 * Determine which match feeds a specific team slot.
 * Returns the feeder match or null (if slot is from generation, e.g. UB R1).
 */
function findFeederMatch(
  match: MatchRow,
  isTeam1Slot: boolean,
  allMatches: MatchRow[],
): MatchRow | null {
  const side = match.bracket_side as BracketSide;

  if (side === 'upper') {
    if (match.round === 1) return null; // UB R1 slots filled from generation
    // team1 ← UB R(n-1) pos 2*P winner; team2 ← UB R(n-1) pos 2*P+1 winner
    const feederPos = isTeam1Slot ? match.position * 2 : match.position * 2 + 1;
    return findMatch(allMatches, 'upper', match.round - 1, feederPos) ?? null;
  }

  if (side === 'lower') {
    if (match.round === 1) {
      // LB R1: team1 ← UB R1 pos 2*P loser; team2 ← UB R1 pos 2*P+1 loser
      const feederPos = isTeam1Slot ? match.position * 2 : match.position * 2 + 1;
      return findMatch(allMatches, 'upper', 1, feederPos) ?? null;
    }
    const isDropIn = match.round % 2 === 0;
    if (isDropIn) {
      if (isTeam1Slot) {
        // team1 ← LB R(n-1) winner at same position
        return findMatch(allMatches, 'lower', match.round - 1, match.position) ?? null;
      } else {
        // team2 ← UB R(round/2+1) loser at same position
        const ubSourceRound = match.round / 2 + 1;
        return findMatch(allMatches, 'upper', ubSourceRound, match.position) ?? null;
      }
    } else {
      // Odd LB round > 1 (consolidation)
      // team1 ← LB R(n-1) pos 2*P; team2 ← LB R(n-1) pos 2*P+1
      const feederPos = isTeam1Slot ? match.position * 2 : match.position * 2 + 1;
      return findMatch(allMatches, 'lower', match.round - 1, feederPos) ?? null;
    }
  }

  if (side === 'grand_final') {
    if (isTeam1Slot) {
      // team1 ← UB Final winner
      const ubFiltered = allMatches.filter((m) => m.bracket_side === 'upper');
      if (ubFiltered.length === 0) return null;
      const ubMaxRound = Math.max(...ubFiltered.map((m) => m.round));
      return findMatch(allMatches, 'upper', ubMaxRound, 0) ?? null;
    } else {
      // team2 ← LB Final winner
      const lbMatches = allMatches.filter((m) => m.bracket_side === 'lower');
      if (lbMatches.length === 0) return null;
      const lbMaxRound = Math.max(...lbMatches.map((m) => m.round));
      return findMatch(allMatches, 'lower', lbMaxRound, 0) ?? null;
    }
  }

  return null;
}

/**
 * Universal BYE sweep: finds pending matches where one/both team slots will
 * never be filled (feeder already completed) and auto-completes them.
 * Runs in a loop to handle cascading BYEs (e.g. LB R1 BYE → LB R2 BYE → …).
 */
async function autoCompleteByes(tournamentId: number): Promise<void> {
  let changed = true;
  while (changed) {
    changed = false;
    const all = await prisma.bracketMatch.findMany({
      where: { tournament_id: tournamentId },
    }) as MatchRow[];
    const isDouble = all.some((m) => m.bracket_side === 'lower');

    for (const m of all) {
      if (m.status !== 'pending') continue;

      const hasT1 = !!m.team1_id;
      const hasT2 = !!m.team2_id;

      if (hasT1 && hasT2) continue; // Both teams present → real match, skip

      if (!hasT1 && !hasT2) {
        // Both slots empty — auto-close only if BOTH feeders are done (ghost match)
        const f1 = findFeederMatch(m, true, all);
        const f2 = findFeederMatch(m, false, all);
        const f1Done = !f1 || f1.status === 'completed';
        const f2Done = !f2 || f2.status === 'completed';
        if (f1Done && f2Done) {
          await prisma.bracketMatch.update({
            where: { id: m.id },
            data: { status: 'completed' }, // No winner — dead match
          });
          changed = true;
          break; // Restart sweep
        }
        continue;
      }

      // One team present, one missing
      const isTeam1Missing = !hasT1;
      const feeder = findFeederMatch(m, isTeam1Missing, all);

      if (!feeder) continue; // UB R1 — slots from generation, not applicable

      if (feeder.status === 'completed') {
        // Feeder finished but slot still empty → will never be filled → auto-BYE
        const winner = hasT1
          ? { id: m.team1_id!, name: m.team1_name }
          : { id: m.team2_id!, name: m.team2_name };

        await prisma.bracketMatch.update({
          where: { id: m.id },
          data: { winner_id: winner.id, winner_name: winner.name, status: 'completed' },
        });

        // Advance the auto-BYE winner
        const freshAll = await prisma.bracketMatch.findMany({
          where: { tournament_id: tournamentId },
        }) as MatchRow[];
        const updatedM = freshAll.find((mm) => mm.id === m.id)!;
        await advanceWinner(updatedM, freshAll, isDouble);

        changed = true;
        break; // Restart sweep (state changed)
      }
    }
  }
}

/**
 * Core advancement logic. Handles single & double elimination.
 */
async function advanceWinner(match: MatchRow, allMatches: MatchRow[], isDouble: boolean): Promise<void> {
  const side = match.bracket_side as BracketSide;
  const winnerId = match.winner_id!;
  const winnerName = match.winner_name;

  // Determine loser
  const loserId = match.team1_id === winnerId ? match.team2_id : match.team1_id;
  const loserName = match.team1_id === winnerId ? match.team2_name : match.team1_name;

  const ubMatches = allMatches.filter((m) => m.bracket_side === 'upper');
  const ubRounds = ubMatches.length > 0 ? Math.max(...ubMatches.map((m) => m.round)) : 0;

  if (side === 'upper') {
    const isUBFinal = match.round === ubRounds;

    if (isUBFinal && isDouble) {
      // UB Final → winner to Grand Final team1
      const gf = allMatches.find((m) => m.bracket_side === 'grand_final');
      if (gf) await setTeamInSlot(gf.id, true, winnerId, winnerName);

      // UB Final loser → LB Final (last LB round)
      if (loserId) {
        const lbMatches = allMatches.filter((m) => m.bracket_side === 'lower');
        if (lbMatches.length > 0) {
          const lbMaxRound = Math.max(...lbMatches.map((m) => m.round));
          const lbFinal = lbMatches.find((m) => m.round === lbMaxRound && m.position === 0);
          if (lbFinal) {
            // Drop-in slot (team2 — UB losers always enter as team2 in even rounds)
            await setTeamInSlot(lbFinal.id, false, loserId, loserName);
          }
        }
      }
    } else if (isUBFinal && !isDouble) {
      // Single elim final — no advancement needed
      return;
    } else {
      // Regular UB round: winner → next UB round
      const nextUB = findMatch(allMatches, 'upper', match.round + 1, Math.floor(match.position / 2));
      if (nextUB) {
        await setTeamInSlot(nextUB.id, match.position % 2 === 0, winnerId, winnerName);
      }

      // Double: loser → LB
      if (isDouble && loserId) {
        await advanceLoserToLB(match, loserId, loserName, allMatches, ubRounds);
      }
    }
  } else if (side === 'lower') {
    const lbMatches = allMatches.filter((m) => m.bracket_side === 'lower');
    if (lbMatches.length === 0) return;
    const lbMaxRound = Math.max(...lbMatches.map((m) => m.round));
    const isLBFinal = match.round === lbMaxRound;

    if (isLBFinal) {
      // LB Final winner → Grand Final team2
      const gf = allMatches.find((m) => m.bracket_side === 'grand_final');
      if (gf) await setTeamInSlot(gf.id, false, winnerId, winnerName);
    } else {
      // Regular LB round: winner → next LB round
      const nextRound = match.round + 1;
      const isNextDropIn = nextRound % 2 === 0; // even = drop-in

      if (isNextDropIn) {
        // Drop-in round: same position, LB survivor goes as team1
        const nextLB = findMatch(allMatches, 'lower', nextRound, match.position);
        if (nextLB) await setTeamInSlot(nextLB.id, true, winnerId, winnerName);
      } else {
        // Consolidation round: halve position
        const nextPos = Math.floor(match.position / 2);
        const nextLB = findMatch(allMatches, 'lower', nextRound, nextPos);
        if (nextLB) await setTeamInSlot(nextLB.id, match.position % 2 === 0, winnerId, winnerName);
      }
    }
  } else if (side === 'grand_final') {
    // Grand final completed — tournament champion. No advancement.
    return;
  }
}

/**
 * Drop UB loser into the correct LB slot.
 *
 * Mapping:
 * - UB R1 losers → LB R1 (consolation). Position: floor(pos/2), slot: pos%2
 * - UB R(k) losers (k>=2) → LB R(2*(k-1)) (drop-in round). Position same as UB pos, slot: team2
 */
async function advanceLoserToLB(
  ubMatch: MatchRow,
  loserId: number,
  loserName: string | null,
  allMatches: MatchRow[],
  _ubRounds: number,
): Promise<void> {
  const ubRound = ubMatch.round;

  if (ubRound === 1) {
    // UB R1 losers → LB R1 (consolation: losers paired together)
    const lbRound = 1;
    const lbPos = Math.floor(ubMatch.position / 2);
    const isSlot1 = ubMatch.position % 2 === 0;
    const target = findMatch(allMatches, 'lower', lbRound, lbPos);
    if (target) await setTeamInSlot(target.id, isSlot1, loserId, loserName);
  } else {
    // UB R(k) losers → LB R(2*(k-1)) (drop-in round)
    const lbRound = 2 * (ubRound - 1);
    const lbPos = ubMatch.position; // same position index
    const target = findMatch(allMatches, 'lower', lbRound, lbPos);
    if (target) {
      // UB losers enter as team2 in drop-in rounds
      await setTeamInSlot(target.id, false, loserId, loserName);
    }
  }
}

async function setTeamInSlot(
  matchId: number,
  isTeam1: boolean,
  teamId: number,
  teamName: string | null,
): Promise<void> {
  await prisma.bracketMatch.update({
    where: { id: matchId },
    data: isTeam1
      ? { team1_id: teamId, team1_name: teamName }
      : { team2_id: teamId, team2_name: teamName },
  });
}

/**
 * Clear a team from the slot it was advanced into.
 * CASCADING: if the team was the winner, recursively clears from all downstream matches.
 */
async function clearTeamFromSlot(matchId: number, teamId: number): Promise<void> {
  const m = await prisma.bracketMatch.findUnique({ where: { id: matchId } }) as MatchRow | null;
  if (!m) return;

  const wasWinner = m.winner_id === teamId;

  const clearData: Record<string, unknown> = {};
  if (m.team1_id === teamId) { clearData.team1_id = null; clearData.team1_name = null; }
  if (m.team2_id === teamId) { clearData.team2_id = null; clearData.team2_name = null; }
  if (wasWinner) { clearData.winner_id = null; clearData.winner_name = null; clearData.status = 'pending'; }

  if (Object.keys(clearData).length > 0) {
    await prisma.bracketMatch.update({ where: { id: matchId }, data: clearData });
  }

  // Cascade: if the cleared team was the winner, it was advanced further — clear downstream
  if (wasWinner) {
    const all = await prisma.bracketMatch.findMany({
      where: { tournament_id: m.tournament_id },
    }) as MatchRow[];
    const isDouble = all.some((mm) => mm.bracket_side === 'lower');

    // Clear winner from the next match it was advanced into
    await rollbackAdvancement(m, teamId, all, isDouble);

    // In double elim UB: the loser was also dropped to LB — clear that too
    if (isDouble && m.bracket_side === 'upper') {
      const loserId = m.team1_id === teamId ? m.team2_id : m.team1_id;
      if (loserId) {
        await rollbackLoserFromLB(m, loserId, all);
      }
    }
  }
}

/**
 * Rollback: remove old winner from the match it was advanced into.
 * Mirrors `advanceWinner` logic to find the target match.
 */
async function rollbackAdvancement(
  match: MatchRow,
  oldWinnerId: number,
  allMatches: MatchRow[],
  isDouble: boolean,
): Promise<void> {
  const side = match.bracket_side as BracketSide;
  const ubMatches = allMatches.filter((m) => m.bracket_side === 'upper');
  const ubRounds = ubMatches.length > 0 ? Math.max(...ubMatches.map((m) => m.round)) : 0;

  if (side === 'upper') {
    const isUBFinal = match.round === ubRounds;
    if (isUBFinal && isDouble) {
      // Winner was in Grand Final team1
      const gf = allMatches.find((m) => m.bracket_side === 'grand_final');
      if (gf) await clearTeamFromSlot(gf.id, oldWinnerId);
    } else if (!isUBFinal) {
      // Winner was in next UB round
      const nextUB = findMatch(allMatches, 'upper', match.round + 1, Math.floor(match.position / 2));
      if (nextUB) await clearTeamFromSlot(nextUB.id, oldWinnerId);
    }
  } else if (side === 'lower') {
    const lbMatches = allMatches.filter((m) => m.bracket_side === 'lower');
    const lbMaxRound = lbMatches.length > 0 ? Math.max(...lbMatches.map((m) => m.round)) : 0;
    const isLBFinal = match.round === lbMaxRound;

    if (isLBFinal) {
      // Winner was in Grand Final team2
      const gf = allMatches.find((m) => m.bracket_side === 'grand_final');
      if (gf) await clearTeamFromSlot(gf.id, oldWinnerId);
    } else {
      const nextRound = match.round + 1;
      const isNextDropIn = nextRound % 2 === 0;
      if (isNextDropIn) {
        const nextLB = findMatch(allMatches, 'lower', nextRound, match.position);
        if (nextLB) await clearTeamFromSlot(nextLB.id, oldWinnerId);
      } else {
        const nextPos = Math.floor(match.position / 2);
        const nextLB = findMatch(allMatches, 'lower', nextRound, nextPos);
        if (nextLB) await clearTeamFromSlot(nextLB.id, oldWinnerId);
      }
    }
  }
}

/**
 * Rollback: remove old loser from the LB slot it was dropped into.
 * Mirrors `advanceLoserToLB` logic.
 */
async function rollbackLoserFromLB(
  ubMatch: MatchRow,
  oldLoserId: number,
  allMatches: MatchRow[],
): Promise<void> {
  const ubRound = ubMatch.round;
  const ubMatches = allMatches.filter((m) => m.bracket_side === 'upper');
  const ubMaxRound = ubMatches.length > 0 ? Math.max(...ubMatches.map((m) => m.round)) : 0;
  const isUBFinal = ubRound === ubMaxRound;

  if (isUBFinal) {
    // UB Final loser was in LB Final team2
    const lbMatches = allMatches.filter((m) => m.bracket_side === 'lower');
    const lbMaxRound = lbMatches.length > 0 ? Math.max(...lbMatches.map((m) => m.round)) : 0;
    const lbFinal = lbMatches.find((m) => m.round === lbMaxRound && m.position === 0);
    if (lbFinal) await clearTeamFromSlot(lbFinal.id, oldLoserId);
  } else if (ubRound === 1) {
    // UB R1 loser was in LB R1
    const lbPos = Math.floor(ubMatch.position / 2);
    const target = findMatch(allMatches, 'lower', 1, lbPos);
    if (target) await clearTeamFromSlot(target.id, oldLoserId);
  } else {
    // UB R(k) loser was in LB R(2*(k-1)) team2
    const lbRound = 2 * (ubRound - 1);
    const target = findMatch(allMatches, 'lower', lbRound, ubMatch.position);
    if (target) await clearTeamFromSlot(target.id, oldLoserId);
  }
}
