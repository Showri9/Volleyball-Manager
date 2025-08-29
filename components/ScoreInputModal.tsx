import React, { useState, useEffect } from 'react';
import type { Match, PlayoffMatch } from '../types';
import Modal from './Modal';

interface ScoreInputModalProps {
  match: Match | PlayoffMatch;
  onClose: () => void;
  onSave: (matchId: string, team1Scores: number[], team2Scores: number[]) => void;
  setsToWin: number;
}

const ScoreInputModal: React.FC<ScoreInputModalProps> = ({ match, onClose, onSave, setsToWin }) => {
  const [team1Scores, setTeam1Scores] = useState<number[]>([]);
  const [team2Scores, setTeam2Scores] = useState<number[]>([]);
  const sets = setsToWin === 1 ? 1 : (setsToWin * 2) - 1;

  useEffect(() => {
    const initialT1Scores = [...match.scores.team1];
    const initialT2Scores = [...match.scores.team2];
    while (initialT1Scores.length < sets) initialT1Scores.push(0);
    while (initialT2Scores.length < sets) initialT2Scores.push(0);
    setTeam1Scores(initialT1Scores.slice(0, sets));
    setTeam2Scores(initialT2Scores.slice(0, sets));
  }, [match, sets]);

  const handleScoreChange = (team: 1 | 2, setIndex: number, value: string) => {
    const newScores = team === 1 ? [...team1Scores] : [...team2Scores];
    newScores[setIndex] = parseInt(value, 10) || 0;
    if (team === 1) {
      setTeam1Scores(newScores);
    } else {
      setTeam2Scores(newScores);
    }
  };

  const handleSave = () => {
    onSave(match.id, team1Scores, team2Scores);
    onClose();
  };

  if (!match.team1 || !match.team2) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="Enter Match Score">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center text-lg font-bold">
          <span className="text-sky-400">{match.team1.name}</span>
          <span className="text-slate-400">vs</span>
          <span className="text-sky-400">{match.team2.name}</span>
        </div>
        
        {Array.from({ length: sets }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <input
              type="number"
              min="0"
              value={team1Scores[i] ?? ''}
              onChange={(e) => handleScoreChange(1, i, e.target.value)}
              className="w-1/3 bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-center focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <span className="text-slate-400 font-semibold">Set {i + 1}</span>
            <input
              type="number"
              min="0"
              value={team2Scores[i] ?? ''}
              onChange={(e) => handleScoreChange(2, i, e.target.value)}
              className="w-1/3 bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-center focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        ))}
        
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition">Cancel</button>
          <button onClick={handleSave} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md transition">Save Score</button>
        </div>
      </div>
    </Modal>
  );
};

export default ScoreInputModal;