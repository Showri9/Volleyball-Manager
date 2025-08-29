import React, { useState, useEffect } from 'react';
import type { Team } from '../types';
import Modal from './Modal';

interface DayScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (teams: Team[], numCourts: number) => void;
  allTeams: Team[];
  initialSelectedTeamIds?: Set<string>;
  initialNumCourts?: number;
  dayNumber: number;
  mode: 'create' | 'edit';
}

const DayScheduleModal: React.FC<DayScheduleModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  allTeams,
  initialSelectedTeamIds,
  initialNumCourts = 1,
  dayNumber,
  mode,
}) => {
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [numCourts, setNumCourts] = useState(initialNumCourts);

  useEffect(() => {
    if (isOpen) {
      setSelectedTeamIds(initialSelectedTeamIds || new Set(allTeams.map(t => t.id)));
      setNumCourts(initialNumCourts);
    }
  }, [isOpen, initialSelectedTeamIds, initialNumCourts, allTeams]);

  const handleTeamSelection = (teamId: string) => {
    setSelectedTeamIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTeamIds.size === allTeams.length) {
      setSelectedTeamIds(new Set()); // deselect all
    } else {
      setSelectedTeamIds(new Set(allTeams.map(t => t.id))); // select all
    }
  };

  const handleSubmit = () => {
    const selectedTeams = allTeams.filter(t => selectedTeamIds.has(t.id));
    if (selectedTeams.length < 2) {
      alert("Please select at least two teams for the day's schedule.");
      return;
    }
    onGenerate(selectedTeams, numCourts);
    onClose();
  };
  
  const title = mode === 'edit' ? `Edit Day ${dayNumber} Schedule` : `Configure Day ${dayNumber} Schedule`;
  const buttonText = mode === 'edit' ? 'Re-generate Schedule' : 'Generate Schedule';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-slate-200">Participating Teams</h3>
            <button onClick={handleSelectAll} className="text-sm text-sky-400 hover:text-sky-300 font-medium">
              {selectedTeamIds.size === allTeams.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto bg-slate-900/50 p-3 rounded-md border border-slate-700 space-y-2">
            {allTeams.map(team => (
              <label key={team.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-700 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTeamIds.has(team.id)}
                  onChange={() => handleTeamSelection(team.id)}
                  className="w-5 h-5 bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500/50 rounded"
                />
                <span className="text-slate-200">{team.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="numCourts" className="block text-sm font-medium text-slate-300 mb-1">Number of Courts</label>
          <input
            type="number"
            id="numCourts"
            value={numCourts}
            onChange={(e) => setNumCourts(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            min="1"
            required
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition">Cancel</button>
          <button onClick={handleSubmit} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md transition">{buttonText}</button>
        </div>
      </div>
    </Modal>
  );
};

export default DayScheduleModal;
