import React, { useState, useMemo } from 'react';
import type { Team, Match } from '../types';
import { PlusIcon } from './icons';
import DayScheduleModal from './DayScheduleModal';

interface ScheduleConfigProps {
  allTeams: Team[];
  schedule: Match[];
  onGenerateDay: (day: number, teams: Team[], numCourts: number) => void;
}

const ScheduleConfig: React.FC<ScheduleConfigProps> = ({ allTeams, schedule, onGenerateDay }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const nextDay = useMemo(() => {
    if (schedule.length === 0) return 1;
    return Math.max(0, ...schedule.map(m => m.day)) + 1;
  }, [schedule]);

  const handleOpenModal = () => {
    if (allTeams.length < 2) {
      alert("Please add at least two teams to generate a schedule.");
      return;
    }
    setIsModalOpen(true);
  };
  
  const handleSubmit = (selectedTeams: Team[], numCourts: number) => {
    onGenerateDay(nextDay, selectedTeams, numCourts);
  };

  return (
    <>
      <div className="max-w-3xl mx-auto bg-slate-800 rounded-lg shadow-xl p-6 mb-8 text-center">
        <h2 className="text-2xl font-bold text-sky-400 mb-4">Schedule Management</h2>
        <p className="text-slate-400 mb-6">
          {schedule.length > 0
            ? `Day ${nextDay - 1} is complete. You can now add the schedule for the next day.`
            : "No schedule has been generated yet. Start by generating the schedule for Day 1."}
        </p>
        <button 
          onClick={handleOpenModal}
          className="flex items-center justify-center gap-2 w-full max-w-xs mx-auto bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 px-4 rounded-md transition duration-300 transform hover:scale-105"
        >
          <PlusIcon className="w-5 h-5"/>
          {`Generate Day ${nextDay} Schedule`}
        </button>
      </div>

      <DayScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleSubmit}
        allTeams={allTeams}
        dayNumber={nextDay}
        mode="create"
      />
    </>
  );
};

export default ScheduleConfig;
