import React, { useState, useMemo } from 'react';
import type { Match, Team } from '../types';
import ScoreInputModal from './ScoreInputModal';
import DayScheduleModal from './DayScheduleModal';
import { PencilIcon, TrashIcon } from './icons';

interface ScheduleViewProps {
  schedule: Match[];
  onUpdateScore: (matchId: string, team1Scores: number[], team2Scores: number[]) => void;
  setsToWin: number;
  onClearDay: (day: number) => void;
  onRegenerateDay: (day: number, teams: Team[], numCourts: number) => void;
  allTeams: Team[];
  onDeleteMatch: (matchId: string) => void;
}

const MatchCell: React.FC<{ 
    match: Match; 
    onOpenScoreModal: (match: Match) => void;
    onDeleteMatch: (matchId: string) => void;
}> = ({ match, onOpenScoreModal, onDeleteMatch }) => {
    const winner = match.winnerId ? (match.winnerId === match.team1.id ? match.team1 : match.team2) : null;
    
    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
            onDeleteMatch(match.id);
        }
    };

    return (
        <div className="bg-slate-800 rounded-md p-3 flex flex-col justify-between h-full text-sm shadow-md">
            <div>
                <div className={`flex justify-between items-center ${winner?.id === match.team1.id ? 'font-bold text-yellow-400' : 'text-slate-200'}`}>
                    <span className="truncate" title={match.team1.name}>{match.team1.name}</span>
                </div>
                <div className="my-1.5 text-center text-xs text-slate-500 font-bold">vs</div>
                <div className={`flex justify-between items-center ${winner?.id === match.team2.id ? 'font-bold text-yellow-400' : 'text-slate-200'}`}>
                    <span className="truncate" title={match.team2.name}>{match.team2.name}</span>
                </div>

                {match.winnerId && (
                     <div className="text-center text-xs text-slate-400 mt-2 font-mono">
                        {match.scores.team1.map((s1, i) => `${s1}-${match.scores.team2[i]}`).join(', ')}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-1 mt-3">
                <button
                    onClick={() => onOpenScoreModal(match)}
                    className="flex-grow bg-slate-700 hover:bg-sky-600 text-white font-semibold py-1.5 px-2 rounded-md transition duration-300 text-xs">
                    {match.winnerId ? 'Edit Score' : 'Enter Score'}
                </button>
                 <button
                    onClick={handleDelete}
                    className="flex-shrink-0 bg-red-900/60 hover:bg-red-800/70 text-red-400 p-1.5 rounded-md transition"
                    title="Delete Match"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};


const ScheduleView: React.FC<ScheduleViewProps> = ({ schedule, onUpdateScore, setsToWin, onClearDay, onRegenerateDay, allTeams, onDeleteMatch }) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editingDay, setEditingDay] = useState<number | null>(null);

  const groupedByDay = useMemo(() => {
    return schedule.reduce((acc, match) => {
      const day = match.day;
      const existingMatches = acc[day] || [];
      return {
        ...acc,
        [day]: [...existingMatches, match],
      };
    }, {} as { [key: number]: Match[] });
  }, [schedule]);

  const editingDayInitialConfig = useMemo(() => {
    if (!editingDay) return null;
    const matchesForDay = groupedByDay[editingDay] || [];
    if (matchesForDay.length === 0) return null;

    const uniqueTeamIds = new Set<string>();
    matchesForDay.forEach(match => {
        uniqueTeamIds.add(match.team1.id);
        uniqueTeamIds.add(match.team2.id);
    });
    
    const numCourts = Math.max(1, ...matchesForDay.map(m => m.court));

    return {
        initialSelectedTeamIds: uniqueTeamIds,
        initialNumCourts: numCourts
    };
  }, [editingDay, groupedByDay]);

  const handleRegenerateSubmit = (selectedTeams: Team[], numCourts: number) => {
    if (editingDay) {
      onRegenerateDay(editingDay, selectedTeams, numCourts);
    }
  };

  const sortedDays = Object.keys(groupedByDay).map(Number).sort((a, b) => a - b);

  if (schedule.length === 0) {
    return <div className="text-center text-slate-400 mt-8">No schedule generated yet. Configure one above.</div>;
  }

  return (
    <div>
      {sortedDays.map(day => {
        const matchesForDay = groupedByDay[day];
        const numCourts = Math.max(0, ...matchesForDay.map(m => m.court));
        
        const timeSlots: Match[][] = [];
        if (matchesForDay.length > 0) {
            const sortedMatches = [...matchesForDay].sort((a,b) => schedule.indexOf(a) - schedule.indexOf(b));
            for (let i = 0; i < sortedMatches.length; i += numCourts) {
                timeSlots.push(sortedMatches.slice(i, i + numCourts));
            }
        }
        
        return (
          <div key={day} className="mb-12">
            <div className="flex justify-between items-center mb-4 border-b-2 border-slate-700 pb-2">
              <h3 className="text-xl font-bold text-sky-400">
                Day {day}
              </h3>
               <div className="flex items-center gap-2">
                  <button
                      onClick={() => setEditingDay(day)}
                      className="flex items-center gap-1.5 bg-blue-900/50 hover:bg-blue-800/60 text-blue-300 font-semibold py-1 px-3 rounded-md transition duration-200 text-sm"
                      title={`Edit Day ${day} schedule`}
                  >
                      <PencilIcon className="w-4 h-4" />
                      Edit
                  </button>
                  <button
                      onClick={() => onClearDay(day)}
                      className="flex items-center gap-1.5 bg-red-900/50 hover:bg-red-800/60 text-red-400 font-semibold py-1 px-3 rounded-md transition duration-200 text-sm"
                      title={`Delete schedule from Day ${day} onwards`}
                  >
                      <TrashIcon className="w-4 h-4" />
                      Delete
                  </button>
                </div>
            </div>
            
            <div className="overflow-x-auto bg-slate-800/50 rounded-lg p-2">
                <table className="min-w-full border-separate" style={{borderSpacing: '0 0.5rem'}}>
                    <thead>
                        <tr>
                            {Array.from({ length: numCourts }, (_, i) => i + 1).map(courtNum => (
                                <th key={courtNum} className="px-3 py-2 text-center text-sm font-medium text-slate-300 uppercase tracking-wider">
                                    Court {courtNum}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map((slot, slotIndex) => (
                            <tr key={slotIndex}>
                                {Array.from({ length: numCourts }, (_, i) => i + 1).map(courtNum => {
                                    const matchForCourt = slot.find(m => m.court === courtNum);
                                    return (
                                        <td key={courtNum} className="px-1.5 py-1 w-[1%] align-top">
                                            {matchForCourt ? (
                                                <MatchCell match={matchForCourt} onOpenScoreModal={setSelectedMatch} onDeleteMatch={onDeleteMatch} />
                                            ) : (
                                                <div className="rounded-md h-full min-h-[120px] bg-slate-800/30"></div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        );
      })}

      {selectedMatch && (
        <ScoreInputModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSave={onUpdateScore}
          setsToWin={setsToWin}
        />
      )}

      {editingDay && editingDayInitialConfig && (
        <DayScheduleModal
            isOpen={!!editingDay}
            onClose={() => setEditingDay(null)}
            onGenerate={handleRegenerateSubmit}
            allTeams={allTeams}
            dayNumber={editingDay}
            mode="edit"
            initialSelectedTeamIds={editingDayInitialConfig.initialSelectedTeamIds}
            initialNumCourts={editingDayInitialConfig.initialNumCourts}
        />
      )}
    </div>
  );
};

export default ScheduleView;
