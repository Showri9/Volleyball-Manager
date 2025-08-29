
import React, { useState, useMemo, useCallback, useReducer, useEffect } from 'react';
import type { Team, Match, Standing, PlayoffBracket, PlayoffMatch, Tournament, Action } from './types';
import { View } from './types';
import TeamManagement from './components/TeamManagement';
import ScheduleConfig from './components/ScheduleConfig';
import ScheduleView from './components/ScheduleView';
import StandingsView from './components/StandingsView';
import PlayoffView from './components/PlayoffView';
import { generateSchedule } from './services/scheduleService';
import { generatePlayoffBracket } from './services/playoffService';
import TournamentList from './components/TournamentList';
import { supabase } from './lib/supabaseClient';
import Auth from './components/authentication';
const Header: React.FC<{ 
    currentView: View; 
    setView: (view: View) => void;
    tournamentName: string;
    onBackToList: () => void;
}> = ({ currentView, setView, tournamentName, onBackToList }) => {
    const navItems = [
        { id: View.Teams, label: 'Teams' },
        { id: View.Schedule, label: 'Schedule' },
        { id: View.Standings, label: 'Standings' },
        { id: View.Playoffs, label: 'Playoffs' },
    ];

    return (
        <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
                <div className="flex-shrink-0">
                     <h1 className="text-2xl font-bold text-sky-400">VolleyManager</h1>
                     <p className="text-sm text-slate-400 -mt-1 truncate max-w-[150px] sm:max-w-xs" title={tournamentName}>{tournamentName}</p>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                                currentView === item.id 
                                ? 'bg-sky-500 text-white shadow-md' 
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                    <button 
                      onClick={onBackToList}
                      className="ml-2 text-slate-400 hover:text-sky-400 transition"
                      title="Back to Tournaments"
                      aria-label="Back to Tournaments"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </nav>
        </header>
    );
};

// --- REDUCER LOGIC ---

type TournamentAction =
  | { type: 'SET_TOURNAMENTS', payload: Tournament[] }
  | { type: 'CREATE_TOURNAMENT'; payload: { name: string; setsToWin: number } }
  | { type: 'DELETE_TOURNAMENT'; payload: { id: string } }
  | { type: 'UPDATE_TOURNAMENT'; payload: { id: string; updateFn: (tournament: Tournament) => void } };

  const tournamentsReducer = (state: Tournament[], action: TournamentAction): Tournament[] => {
    switch (action.type) {
        case 'SET_TOURNAMENTS':
            return action.payload;
        case 'CREATE_TOURNAMENT': {
      const { name, setsToWin } = action.payload;
      const newTournament: Tournament = {
        id: Date.now().toString(),
        name,
        teams: [],
        schedule: [],
        playoffBracket: null,
        setsToWin,
      };
      return [...state, newTournament];
    }
    case 'DELETE_TOURNAMENT': {
      return state.filter(t => t.id !== action.payload.id);
    }
    case 'UPDATE_TOURNAMENT': {
      const { id, updateFn } = action.payload;
      return state.map(tournament => {
        if (tournament.id === id) {
          // Deep clone to ensure immutability and prevent nested state issues
          const updatedTournament = JSON.parse(JSON.stringify(tournament));
          updateFn(updatedTournament);
          return updatedTournament;
        }
        return tournament;
      });
    }
    default:
      return state;
  }
};

const App: React.FC = () => {
    const [view, setView] = useState<View>(View.Teams);
    const [tournaments, dispatch] = useReducer(tournamentsReducer, []);
    const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session)
          setLoading(false);
        })
    
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session)
        })
    
        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        const fetchTournaments = async () => {
            if (session) {
                setLoading(true);
                const { data, error } = await supabase
                    .from('tournaments')
                    .select(`
                        *,
                        teams (*),
                        matches (*),
                        playoff_matches (*)
                    `);

                if (error) {
                    console.error('Error fetching tournaments:', error);
                } else if (data) {
                    const formattedData = data.map(t => ({
                        ...t,
                        id: String(t.id),
                        playoffMatches: t.playoff_matches.map(pm => ({ ...pm, id: String(pm.id) })),
                        matches: t.matches.map(m => ({ ...m, id: String(m.id) })),
                        teams: t.teams.map(team => ({ ...team, id: String(team.id) })),
                    }));
                    dispatch({ type: 'SET_TOURNAMENTS', payload: formattedData });

                    // *** ADD THIS LOGIC ***
                    // If there's no active tournament selected, select the first one from the list.
                    if (!activeTournamentId && formattedData.length > 0) {
                        setActiveTournamentId(formattedData[0].id);
                    }
                }
                setLoading(false);
            }
        };
        fetchTournaments();
    // Add activeTournamentId to the dependency array
    }, [session, activeTournamentId]);

    const handleCreateTournament = (name: string, setsToWin: number) => {
        const newTournamentId = Date.now().toString(); // Pre-generate ID
        const newTournament: Tournament = {
          id: newTournamentId,
          name,
          teams: [],
          schedule: [],
          playoffBracket: null,
          setsToWin,
        };
        const updatedTournaments = [...tournaments, newTournament];
        dispatch({ type: 'SET_TOURNAMENTS', payload: updatedTournaments });
        setActiveTournamentId(newTournamentId);
        setView(View.Teams);
    };

    const handleDeleteTournament = (id: string) => {
        dispatch({ type: 'DELETE_TOURNAMENT', payload: { id } });
        if (activeTournamentId === id) {
            setActiveTournamentId(null);
        }
    };
    
    const handleSelectTournament = (id: string) => {
        setActiveTournamentId(id);
        setView(View.Teams);
    };
    
    const handleBackToList = () => {
        setActiveTournamentId(null);
    };

    // Helper to dispatch updates for the active tournament
    const updateActiveTournament = (updateFn: (tournament: Tournament) => void) => {
        if (!activeTournamentId) return;
        dispatch({
            type: 'UPDATE_TOURNAMENT',
            payload: { id: activeTournamentId, updateFn }
        });
    };

    const handleAddTeam = (name: string) => {
        const newTeam: Team = { id: Date.now().toString(), name };
        updateActiveTournament(t => {
            t.teams.push(newTeam);
        });
    };

    const handleUpdateTeam = (id: string, name: string) => {
        updateActiveTournament(t => {
            const teamToUpdate = t.teams.find(team => team.id === id);
            if (teamToUpdate) teamToUpdate.name = name;
            t.schedule.forEach((m: Match) => {
                if (m.team1.id === id) m.team1.name = name;
                if (m.team2.id === id) m.team2.name = name;
            });
            if (t.playoffBracket) {
                t.playoffBracket.rounds.forEach(round => round.forEach((m: PlayoffMatch) => {
                    if (m.team1?.id === id) m.team1.name = name;
                    if (m.team2?.id === id) m.team2.name = name;
                }));
            }
        });
    };

    const handleDeleteTeam = (id: string) => {
        updateActiveTournament(t => {
            t.teams = t.teams.filter(team => team.id !== id);
            t.schedule = [];
            t.playoffBracket = null;
        });
    };

    const handleGenerateDaySchedule = (day: number, teamsForDay: Team[], numCourts: number) => {
        const { schedule: newMatches, error } = generateSchedule(teamsForDay, day, numCourts);
        if (error) {
            alert(error);
            return;
        }
        updateActiveTournament(t => {
            t.schedule.push(...newMatches);
        });
    };

    const handleRegenerateDaySchedule = (dayToRegenerate: number, teamsForDay: Team[], numCourts: number) => {
        const confirmed = window.confirm(`This will re-generate the schedule for Day ${dayToRegenerate}, which will clear its current matches and the schedule for all subsequent days. Are you sure you want to continue?`);
        if (confirmed) {
            updateActiveTournament(t => {
                t.schedule = t.schedule.filter((m: Match) => m.day < dayToRegenerate);
                const { schedule: newMatches, error } = generateSchedule(teamsForDay, dayToRegenerate, numCourts);
                if (error) {
                    console.error(error); 
                    return;
                }
                t.schedule.push(...newMatches);
                t.playoffBracket = null;
            });
        }
    };

    const handleClearDaySchedule = (dayToClear: number) => {
        const confirmed = window.confirm(`Are you sure you want to clear the schedule for Day ${dayToClear} and all subsequent days? This will also reset any playoff bracket.`);
        if (confirmed) {
            updateActiveTournament(t => {
                t.schedule = t.schedule.filter((m: Match) => m.day < dayToClear);
                t.playoffBracket = null;
            });
        }
    };

    const handleDeleteMatch = (matchId: string) => {
        updateActiveTournament(t => {
            t.schedule = t.schedule.filter((m: Match) => m.id !== matchId);
            t.playoffBracket = null;
        });
    };

    const handleUpdateMatchScore = (matchId: string, team1Scores: number[], team2Scores: number[]) => {
        updateActiveTournament(t => {
            let targetMatch: Match | PlayoffMatch | undefined;
            const isPlayoffMatch = t.playoffBracket?.rounds.flat().some(m => m.id === matchId);

            if (isPlayoffMatch) {
                targetMatch = t.playoffBracket!.rounds.flat().find(m => m.id === matchId);
            } else {
                targetMatch = t.schedule.find(m => m.id === matchId);
            }

            if (!targetMatch) return;

            const setsToWin = isPlayoffMatch ? t.playoffBracket!.setsToWin : t.setsToWin;
            
            targetMatch.scores = { team1: team1Scores, team2: team2Scores };
            targetMatch.winnerId = undefined; 

            let team1Sets = 0;
            let team2Sets = 0;
            for (let i = 0; i < team1Scores.length; i++) {
                if ((team1Scores[i] || 0) > (team2Scores[i] || 0)) team1Sets++;
                else if ((team2Scores[i] || 0) > (team1Scores[i] || 0)) team2Sets++;
            }

            if (team1Sets >= setsToWin) {
                targetMatch.winnerId = targetMatch.team1!.id;
            } else if (team2Sets >= setsToWin) {
                targetMatch.winnerId = targetMatch.team2!.id;
            }

            if (isPlayoffMatch && targetMatch.winnerId && (targetMatch as PlayoffMatch).nextMatchId) {
                const playoffMatch = targetMatch as PlayoffMatch;
                const winner = playoffMatch.winnerId === playoffMatch.team1?.id ? playoffMatch.team1 : playoffMatch.team2;
                const nextMatch = t.playoffBracket!.rounds.flat().find(m => m.id === playoffMatch.nextMatchId);
                if (nextMatch && winner) {
                    if (nextMatch.team1?.id === winner.id || nextMatch.team2?.id === winner.id) return; // Don't re-add
                    if (!nextMatch.team1) nextMatch.team1 = winner;
                    else if (!nextMatch.team2) nextMatch.team2 = winner;
                }
            }
        });
    };

    const standings = useMemo<Standing[]>(() => {
        if (!activeTournamentId) return [];
        const stats: { [key: string]: Standing } = activeTournamentId.teams.reduce((acc, team) => {
            acc[team.id] = { team, wins: 0, losses: 0, setsWon: 0, setsLost: 0, pointsFor: 0, pointsAgainst: 0 };
            return acc;
        }, {} as { [key: string]: Standing });

        activeTournamentId.schedule.forEach(match => {
            if (!match.winnerId) return;
            const loserId = match.winnerId === match.team1.id ? match.team2.id : match.team1.id;
            if (stats[match.winnerId]) stats[match.winnerId].wins++;
            if (stats[loserId]) stats[loserId].losses++;
            let team1SetsWon = 0, team2SetsWon = 0, team1Points = 0, team2Points = 0;
            for(let i=0; i < match.scores.team1.length; i++){
                const s1 = match.scores.team1[i] || 0;
                const s2 = match.scores.team2[i] || 0;
                team1Points += s1; team2Points += s2;
                if(s1 > s2) team1SetsWon++; else if (s2 > s1) team2SetsWon++;
            }
            if(stats[match.team1.id]){
                stats[match.team1.id].setsWon += team1SetsWon; stats[match.team1.id].setsLost += team2SetsWon;
                stats[match.team1.id].pointsFor += team1Points; stats[match.team1.id].pointsAgainst += team2Points;
            }
            if(stats[match.team2.id]){
                stats[match.team2.id].setsWon += team2SetsWon; stats[match.team2.id].setsLost += team1SetsWon;
                stats[match.team2.id].pointsFor += team2Points; stats[match.team2.id].pointsAgainst += team1Points;
            }
        });

        return Object.values(stats).sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            const aSetDiff = a.setsWon - a.setsLost;
            const bSetDiff = b.setsWon - b.setsLost;
            if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
            const aPointDiff = a.pointsFor - a.pointsAgainst;
            const bPointDiff = b.pointsFor - b.pointsAgainst;
            return bPointDiff - aPointDiff;
        });
    }, [activeTournamentId]);

    const handleGeneratePlayoffs = (numTeams: number, setsToWin: number, firstRoundPairings: { team1: Team, team2: Team }[], byeTeamIds: Set<string>) => {
        if (!standings || !activeTournamentId) return;
        
        const teamsWithByes = activeTournamentId.teams.filter(t => byeTeamIds.has(t.id));
        const bracket = generatePlayoffBracket(standings, numTeams, setsToWin, firstRoundPairings, teamsWithByes);
        
        updateActiveTournament(t => {
            t.playoffBracket = bracket;
        });
        setView(View.Playoffs);
    };

    // This effect handles setting the first tournament as active on initial load
    useEffect(() => {
        if (tournaments.length > 0 && !activeTournamentId) {
             const lastTournament = tournaments[0];
             setActiveTournamentId(lastTournament.id);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tournaments]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><div className="text-xl">Loading...</div></div>;
    }

    if (!session) {
        return <Auth />;
    }

    if (!activeTournamentId) {
        return <TournamentList 
            tournaments={tournaments}
            onCreate={handleCreateTournament}
            onSelect={handleSelectTournament}
            onDelete={handleDeleteTournament}
        />;
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <Header currentView={view} setView={setView} tournamentName={activeTournamentId.name} onBackToList={handleBackToList} />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {view === View.Teams && (
                    <TeamManagement teams={activeTournamentId.teams} onAdd={handleAddTeam} onUpdate={handleUpdateTeam} onDelete={handleDeleteTeam} />
                )}
                {view === View.Schedule && (
                     <>
                        <ScheduleConfig
                            allTeams={activeTournamentId.teams}
                            schedule={activeTournamentId.schedule}
                            onGenerateDay={handleGenerateDaySchedule}
                        />
                        <ScheduleView 
                            schedule={activeTournamentId.schedule} 
                            onUpdateScore={handleUpdateMatchScore} 
                            setsToWin={activeTournamentId.setsToWin}
                            onClearDay={handleClearDaySchedule}
                            onRegenerateDay={handleRegenerateDaySchedule}
                            allTeams={activeTournamentId.teams}
                            onDeleteMatch={handleDeleteMatch}
                        />
                    </>
                )}
                {view === View.Standings && <StandingsView standings={standings} />}
                {view === View.Playoffs && <PlayoffView 
                    standings={standings} 
                    bracket={activeTournamentId.playoffBracket} 
                    onGenerate={handleGeneratePlayoffs} 
                    onUpdateScore={handleUpdateMatchScore} 
                    setsToWin={activeTournamentId.playoffBracket?.setsToWin ?? activeTournamentId.setsToWin} 
                />}
            </main>
        </div>
    );
};

export default App;
