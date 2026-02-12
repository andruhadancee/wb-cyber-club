declare module '@g-loot/react-tournament-brackets' {
  import type { ComponentType, ReactNode } from 'react';

  export interface ThemeConfig {
    textColor?: { main?: string; highlighted?: string; dark?: string };
    matchBackground?: { wonColor?: string; lostColor?: string };
    score?: {
      background?: { wonColor?: string; lostColor?: string };
      text?: { highlightedWonColor?: string; highlightedLostColor?: string };
    };
    border?: { color?: string; highlightedColor?: string };
    roundHeader?: { backgroundColor?: string; fontColor?: string };
    connectorColor?: string;
    connectorColorHighlight?: string;
    svgBackground?: string;
  }

  export interface MatchParticipant {
    id: string;
    name: string;
    resultText: string | null;
    isWinner: boolean;
    status: 'PLAYED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | null;
  }

  export interface MatchData {
    id: number | string;
    name: string;
    nextMatchId: number | string | null;
    nextLooserMatchId?: number | string | null;
    tournamentRoundText: string;
    startTime: string;
    state: string;
    participants: MatchParticipant[];
  }

  export interface BracketProps {
    matches: MatchData[];
    matchComponent?: ComponentType<any>;
    theme?: ThemeConfig;
    options?: {
      style?: {
        roundHeader?: { backgroundColor?: string; fontColor?: string };
        connectorColor?: string;
        connectorColorHighlight?: string;
      };
    };
    svgWrapper?: ComponentType<any>;
    onMatchClick?: (args: { match: MatchData; topWon: boolean; bottomWon: boolean }) => void;
    onPartyClick?: (party: MatchParticipant, partyWon: boolean) => void;
  }

  export interface SVGViewerProps {
    width: number;
    height: number;
    background?: string;
    SVGBackground?: string;
    children?: ReactNode;
    [key: string]: any;
  }

  export const SingleEliminationBracket: ComponentType<BracketProps>;
  export const DoubleEliminationBracket: ComponentType<BracketProps>;
  export const Match: ComponentType<any>;
  export const SVGViewer: ComponentType<SVGViewerProps>;
  export function createTheme(config: ThemeConfig): ThemeConfig;

  export const MATCH_STATES: {
    PLAYED: string;
    NO_SHOW: string;
    WALK_OVER: string;
    NO_PARTY: string;
    DONE: string;
    SCORE_DONE: string;
  };
}
