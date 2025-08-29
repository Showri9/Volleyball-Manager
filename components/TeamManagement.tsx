
import React, { useState } from 'react';
import type { Team } from '../types';
import Modal from './Modal';
import { PencilIcon, TrashIcon, PlusIcon } from './icons';

interface TeamManagementProps {
  teams: Team[];
  onAdd: (name: string) => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ teams, onAdd, onUpdate, onDelete }) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName.trim()) {
      onAdd(newTeamName.trim());
      setNewTeamName('');
    }
  };

  const handleUpdate = () => {
    if (editingTeam && editingTeam.name.trim()) {
      onUpdate(editingTeam.id, editingTeam.name.trim());
      setEditingTeam(null);
    }
  };

  const handleDelete = () => {
    if (deletingTeam) {
      onDelete(deletingTeam.id);
      setDeletingTeam(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-sky-400 mb-6">Team Management</h2>
      
      <form onSubmit={handleAdd} className="flex gap-2 mb-8">
        <input
          type="text"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          placeholder="Enter new team name"
          className="flex-grow bg-slate-800 border border-slate-600 rounded-md px-4 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
        />
        <button type="submit" className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105">
          <PlusIcon className="w-5 h-5"/>
          Add Team
        </button>
      </form>

      <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden">
        <ul className="divide-y divide-slate-700">
          {teams.length > 0 ? teams.map(team => (
            <li key={team.id} className="flex items-center justify-between p-4 hover:bg-slate-700/50 transition">
              <span className="text-lg text-slate-200">{team.name}</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setEditingTeam(team)} className="text-slate-400 hover:text-sky-400 transition">
                  <PencilIcon />
                </button>
                <button onClick={() => setDeletingTeam(team)} className="text-slate-400 hover:text-red-500 transition">
                  <TrashIcon />
                </button>
              </div>
            </li>
          )) : (
            <li className="p-6 text-center text-slate-400">No teams added yet.</li>
          )}
        </ul>
      </div>

      {editingTeam && (
        <Modal isOpen={!!editingTeam} onClose={() => setEditingTeam(null)} title="Edit Team Name">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={editingTeam.name}
              onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
              className="bg-slate-700 border border-slate-600 rounded-md px-4 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingTeam(null)} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition">Cancel</button>
              <button onClick={handleUpdate} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md transition">Save Changes</button>
            </div>
          </div>
        </Modal>
      )}

      {deletingTeam && (
        <Modal isOpen={!!deletingTeam} onClose={() => setDeletingTeam(null)} title="Confirm Deletion">
          <div className="flex flex-col gap-4">
            <p>Are you sure you want to delete the team "{deletingTeam.name}"? This action cannot be undone and will clear any existing schedule.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeletingTeam(null)} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition">Cancel</button>
              <button onClick={handleDelete} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition">Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TeamManagement;
