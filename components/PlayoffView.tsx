
import React, { useState, useMemo, useEffect } from 'react';
import type { Standing, PlayoffBracket, PlayoffMatch, Team } from '../types';
import ScoreInputModal from './ScoreInputModal';
import { TrophyIcon } from './icons';

interface PlayoffViewProps {
  standings: Standing[];
  bracket: PlayoffBracket | null;
  onGenerate: (numTeams: number, setsToWin: number, firstRoundPairings: { team1: Team, team2: Team }[], byeTeamIds: Set<string>) => void;
  onUpdateScore: (matchId: string, team1Scores: number[], team2Scores: number[]) => void;
  setsToWin: number;
}

const PlayoffMatchCard: React.FC<{ match: PlayoffMatch, onOpenScoreModal: (match: PlayoffMatch) => void }> = ({ match, onOpenScoreModal }) => {
    const winner = match.winnerId ? (match.winnerId === match.team1?.id ? match.team1 : match.team2) : null;
    
    return (
        <div className={`bg-slate-800 rounded-lg p-3 min-h-[120px] flex flex-col justify-between shadow-lg ${!match.team1 && !match.team2 ? 'bg-opacity-50' : ''}`}>
            <div>
                <div className={`flex justify-between items-center ${winner?.id === match.team1?.id ? 'font-bold text-yellow-400' : ''}`}>
                    <span>{match.team1?.name || `TBD`}</span>
                    {match.scores.team1.length > 0 && <span className="font-mono text-sm">{match.scores.team1.join(', ')}</span>}
                </div>
                <div className="my-2 border-t border-dashed border-slate-600"></div>
                 <div className={`flex justify-between items-center ${winner?.id === match.team2?.id ? 'font-bold text-yellow-400' : ''}`}>
                    <span>{match.team2?.name || `TBD`}</span>
                     {match.scores.team2.length > 0 && <span className="font-mono text-sm">{match.scores.team2.join(', ')}</span>}
                </div>
            </div>
            {match.team1 && match.team2 && (
                 <button
                    onClick={() => onOpenScoreModal(match)}
                    className="mt-2 w-full bg-slate-700 hover:bg-sky-600 text-white font-semibold py-1 px-2 rounded text-xs transition duration-300">
                    {match.winnerId ? 'Edit Score' : 'Enter Score'}
                </button>
            )}
        </div>
    );
}

const GeneratePlayoff: React.FC<{
  standings: Standing[];
  onGenerate: PlayoffViewProps['onGenerate'];
  initialSets: number;
}> = ({ standings, onGenerate, initialSets }) => {
    const [numTeams, setNumTeams] = useState(standings.length >= 4 ? 4 : standings.length >= 2 ? 2 : 0);
    const [playoffSets, setPlayoffSets] = useState(initialSets);
    const [pairings, setPairings] = useState<{ team1Id: string | null; team2Id: string | null }[]>([]);
    const [byeTeamIds, setByeTeamIds] = useState<Set<string>>(new Set());

    const playoffTeamOptions = Array.from({ length: standings.length - 1 }, (_, i) => i + 2);

    const { playoffTeams, numByes, teamsInFirstRound } = useMemo(() => {
        if (standings.length < 2 || numTeams < 2) return { playoffTeams: [], numByes: 0, teamsInFirstRound: [] };
        
        const currentPlayoffTeams = standings.slice(0, numTeams).map(s => s.team);
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(numTeams)));
        const currentNumByes = bracketSize - numTeams;
        const teamsInFirstRound = currentPlayoffTeams.filter(t => !byeTeamIds.has(t.id));
        
        return { playoffTeams: currentPlayoffTeams, numByes: currentNumByes, teamsInFirstRound };
    }, [standings, numTeams, byeTeamIds]);

    // Effect to reset byes and pairings if the number of teams changes
    useEffect(() => {
        setByeTeamIds(new Set());
        const numMatches = (playoffTeams.length - numByes) / 2;
        setPairings(Array.from({ length: numMatches }, () => ({ team1Id: null, team2Id: null })));
    }, [numTeams, playoffTeams.length, numByes]);
    
    // Effect to update pairings when byes change
    useEffect(() => {
        const numMatches = teamsInFirstRound.length / 2;
        setPairings(Array.from({ length: numMatches }, () => ({ team1Id: null, team2Id: null })));
    }, [byeTeamIds, teamsInFirstRound.length]);

    const handleByeSelection = (teamId: string) => {
        setByeTeamIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(teamId)) {
                newSet.delete(teamId);
            } else {
                if (newSet.size < numByes) {
                    newSet.add(teamId);
                } else {
                    alert(`You can only select ${numByes} team(s) for a bye.`);
                }
            }
            return newSet;
        });
    };

    const handleAutoSeed = () => {
        const localTeams = [...teamsInFirstRound];
        const newPairings = [];
        while (localTeams.length > 0) {
            const team1 = localTeams.shift()!;
            const team2 = localTeams.pop()!;
            newPairings.push({ team1Id: team1.id, team2Id: team2.id });
        }
        setPairings(newPairings);
    };

    const handlePairingChange = (matchIndex: number, teamSlot: 'team1Id' | 'team2Id', teamId: string) => {
        const newPairings = [...pairings];
        newPairings[matchIndex][teamSlot] = teamId;
        setPairings(newPairings);
    };

    const handleGenerate = () => {
        if (numByes > 0 && byeTeamIds.size !== numByes) {
            alert(`Please select exactly ${numByes} team(s) to receive a bye.`);
            return;
        }

        const usedTeamIds = new Set<string>();
        const finalPairings: { team1: Team, team2: Team }[] = [];
        
        for (const p of pairings) {
            if (!p.team1Id || !p.team2Id) {
                alert("All matches must have two teams selected.");
                return;
            }
            if (p.team1Id === p.team2Id) {
                alert("A team cannot be matched against itself.");
                return;
            }
            if (usedTeamIds.has(p.team1Id) || usedTeamIds.has(p.team2Id)) {
                alert("Each team can only be assigned to one match in the first round.");
                return;
            }
            usedTeamIds.add(p.team1Id);
            usedTeamIds.add(p.team2Id);
            
            const team1 = standings.find(s => s.team.id === p.team1Id)?.team;
            const team2 = standings.find(s => s.team.id === p.team2Id)?.team;

            if (team1 && team2) {
                finalPairings.push({ team1, team2 });
            }
        }
        
        if (finalPairings.length !== teamsInFirstRound.length / 2) {
             alert("Something went wrong with creating the pairings. Please check your selections.");
             return;
        }

        onGenerate(numTeams, playoffSets, finalPairings, byeTeamIds);
    };
    
    const getAvailableTeams = (matchIndex: number, teamSlot: 'team1Id' | 'team2Id'): Team[] => {
        const currentPairing = pairings[matchIndex];
        const selectedIdInOtherSlot = teamSlot === 'team1Id' ? currentPairing.team2Id : currentPairing.team1Id;
        
        const usedIdsInOtherMatches = new Set<string>();
        pairings.forEach((p, index) => {
            if (index !== matchIndex) {
                if (p.team1Id) usedIdsInOtherMatches.add(p.team1Id);
                if (p.team2Id) usedIdsInOtherMatches.add(p.team2Id);
            }
        });

        return teamsInFirstRound.filter(
            team => team.id !== selectedIdInOtherSlot && !usedIdsInOtherMatches.has(team.id)
        );
    };

    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-sky-400 mb-6 text-center">Playoffs</h2>
        <div className="bg-slate-800 rounded-lg shadow-xl p-6 flex flex-col gap-6">
            <h3 className="text-xl font-semibold text-center -mb-2">Generate Playoff Bracket</h3>
             {standings.length < 2 ? (
                <p className="text-yellow-400 text-center">Not enough teams (at least 2 required) to generate a playoff bracket.</p>
            ) : (
             <>
                {/* --- SETTINGS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="num-teams" className="block text-sm font-medium text-slate-300 mb-1">Number of Teams</label>
                        <select id="num-teams" value={numTeams} onChange={e => setNumTeams(parseInt(e.target.value))} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none">
                            {playoffTeamOptions.map(count => <option key={count} value={count}>Top {count} Teams</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="playoff-sets" className="block text-sm font-medium text-slate-300 mb-1">Match Format</label>
                        <select id="playoff-sets" value={playoffSets} onChange={e => setPlayoffSets(parseInt(e.target.value))} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none">
                            <option value={1}>1 Set Match</option>
                            <option value={2}>Best of 3 sets</option>
                            <option value={3}>Best of 5 sets</option>
                        </select>
                    </div>
                </div>

                {/* --- BYES --- */}
                {numByes > 0 && (
                     <div>
                        <h4 className="font-semibold text-slate-200 mb-2">Select {numByes} Team(s) to Receive a Bye</h4>
                        <div className="max-h-48 overflow-y-auto bg-slate-900/50 p-3 rounded-md border border-slate-700 space-y-2">
                             {playoffTeams.map(team => (
                                <label key={team.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-700 transition cursor-pointer">
                                    <input
                                    type="checkbox"
                                    checked={byeTeamIds.has(team.id)}
                                    onChange={() => handleByeSelection(team.id)}
                                    className="w-5 h-5 bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500/50 rounded"
                                    />
                                    <span className="text-slate-200">{team.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* --- MATCHUPS --- */}
                {teamsInFirstRound.length > 0 && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-slate-200">First Round Matchups</h4>
                            <button onClick={handleAutoSeed} className="text-sm font-medium text-sky-400 hover:text-sky-300">Auto-seed matchups</button>
                        </div>
                        <div className="space-y-3">
                            {pairings.map((p, index) => (
                                <div key={index} className="flex items-center justify-between gap-2 bg-slate-900/50 p-2 rounded-md">
                                    <select value={p.team1Id ?? ""} onChange={(e) => handlePairingChange(index, 'team1Id', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none">
                                        <option value="" disabled>Select Team</option>
                                        {getAvailableTeams(index, 'team1Id').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <span className="font-bold text-slate-400">vs</span>
                                    <select value={p.team2Id ?? ""} onChange={(e) => handlePairingChange(index, 'team2Id', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none">
                                        <option value="" disabled>Select Team</option>
                                        {getAvailableTeams(index, 'team2Id').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* --- GENERATE BUTTON --- */}
                <button onClick={handleGenerate} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 px-4 rounded-md transition duration-300 transform hover:scale-105 mt-2">
                    Generate Bracket
                </button>
            </>
            )}
        </div>
      </div>
    );
};


const PlayoffView: React.FC<PlayoffViewProps> = ({ standings, bracket, onGenerate, onUpdateScore, setsToWin }) => {
  const [selectedMatch, setSelectedMatch] = useState<PlayoffMatch | null>(null);
  
  if (!bracket) {
    return <GeneratePlayoff standings={standings} onGenerate={onGenerate} initialSets={setsToWin} />;
  }

  const champion = bracket.rounds[bracket.rounds.length - 1][0].winnerId 
    ? standings.find(s => s.team.id === bracket.rounds[bracket.rounds.length - 1][0].winnerId)?.team
    : null;

  return (
    <div>
        <h2 className="text-3xl font-bold text-sky-400 mb-6 text-center">Playoff Bracket</h2>
        
        {champion && (
            <div className="mb-8 text-center bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 max-w-lg mx-auto">
                <h3 className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-3">
                    <TrophyIcon className="w-8 h-8"/> Tournament Champion <TrophyIcon className="w-8 h-8"/>
                </h3>
                <p className="text-4xl font-extrabold text-white mt-2">{champion.name}</p>
            </div>
        )}

        <div className="flex justify-center items-start gap-4 md:gap-8 overflow-x-auto p-4">
            {bracket.rounds.map((round, roundIndex) => (
                <div key={roundIndex} className="flex flex-col justify-around gap-8 min-w-[200px]">
                    <h4 className="text-center text-lg font-semibold text-slate-300">
                        {round.length === 1 ? 'Final' : round.length === 2 ? 'Semifinals' : `Round ${roundIndex + 1}`}
                    </h4>
                    {round.map(match => (
                        <PlayoffMatchCard key={match.id} match={match} onOpenScoreModal={setSelectedMatch}/>
                    ))}
                </div>
            ))}
        </div>
        
        {selectedMatch && (
            <ScoreInputModal
                match={selectedMatch}
                onClose={() => setSelectedMatch(null)}
                onSave={onUpdateScore}
                setsToWin={setsToWin}
            />
        )}
    </div>
  );
};

export default PlayoffView;
