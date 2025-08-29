import React, { useState } from 'react';
import type { Action, Tournament } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon } from './icons';
import { supabase } from '../lib/supabaseClient';

type TournamentAction =
  | { type: 'ADD_TOURNAMENT'; payload: Tournament }
  | { type: 'DELETE_TOURNAMENT'; payload: string };

  interface TournamentListProps {
    tournaments: Tournament[];
    onSelect: (id: string) => void;
    dispatch: React.Dispatch<TournamentAction>;
  }

const TournamentList: React.FC<TournamentListProps> = ({ tournaments, onSelect, dispatch }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null);
  
  const [newTournamentName, setNewTournamentName] = useState('');
  const [setsToWin, setSetsToWin] = useState(2); // Default to "Best of 3"

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTournamentName.trim() === '') return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("You must be logged in to add a tournament.");
        return;
    }

    // Insert the new tournament into the database
    const { data, error } = await supabase
        .from('tournaments')
        .insert({ 
            name: newTournamentName.trim(), 
            user_id: user.id,
            sets_to_win: setsToWin 
        })
        .select()
        .single();

        if (error) {
          console.error('Error creating tournament:', error);
          alert('Failed to create tournament.');
      } else if (data) {
          // The ID from Supabase is a number, but our app uses strings.
          const newTournament = { 
              ...data, 
              id: String(data.id), // Convert ID to string
              teams: [], 
              matches: [], 
              playoffMatches: [] 
          };
          dispatch({ type: 'ADD_TOURNAMENT', payload: newTournament });
          
          // Reset form and close modal
          setNewTournamentName('');
          setSetsToWin(2);
          setIsCreating(false);
  
          // *** ADD THIS LINE ***
          // Automatically select the new tournament
          onSelect(newTournament.id);
      }
    };

  const handleDeleteConfirm = async () => {
    if (!deletingTournament) return;

    const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', deletingTournament.id);

    if (error) {
        console.error('Error deleting tournament:', error);
        alert('Failed to delete tournament.');
    } else {
        dispatch({ type: 'DELETE_TOURNAMENT', payload: deletingTournament.id });
    }
    setDeletingTournament(null);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-sky-400 mb-2">VolleyManager</h1>
            <p className="text-slate-400">Your Tournaments</p>
        </div>
        
        <div className="bg-slate-800 rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Select a Tournament</h2>
                 <button 
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105"
                >
                    <PlusIcon className="w-5 h-5"/>
                    New Tournament
                </button>
            </div>

            <ul className="divide-y divide-slate-700">
                {tournaments.length > 0 ? tournaments.map(t => (
                    <li key={t.id} className="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-slate-700/50 transition group">
                        <button onClick={() => onSelect(t.id)} className="flex-grow text-left">
                             <span className="text-lg text-slate-200 group-hover:text-sky-400 transition">{t.name}</span>
                             <span className="text-sm text-slate-400 ml-3">{t.teams.length} teams</span>
                        </button>
                        <button onClick={() => setDeletingTournament(t)} className="text-slate-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                            <TrashIcon />
                        </button>
                    </li>
                )) : (
                    <li className="p-6 text-center text-slate-400">No tournaments yet. Create one to get started!</li>
                )}
            </ul>
        </div>
      </div>
      
      {isCreating && (
          <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} title="Create New Tournament">
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label htmlFor="t-name" className="block text-sm font-medium text-slate-300 mb-1">Tournament Name</label>
                <input
                  id="t-name"
                  type="text"
                  value={newTournamentName}
                  onChange={(e) => setNewTournamentName(e.target.value)}
                  placeholder="e.g. Summer Beach Cup"
                  className="w-full bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="setsToWin" className="block text-sm font-medium text-slate-300 mb-1">Match Format</label>
                <select
                    id="setsToWin"
                    value={setsToWin}
                    onChange={(e) => setSetsToWin(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                >
                    <option value={1}>1 Set Match</option>
                    <option value={2}>Best of 3 sets</option>
                    <option value={3}>Best of 5 sets</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                 <button type="button" onClick={() => setIsCreating(false)} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition">Cancel</button>
                 <button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md transition">Create</button>
              </div>
            </form>
          </Modal>
      )}

      {deletingTournament && (
        <Modal isOpen={!!deletingTournament} onClose={() => setDeletingTournament(null)} title="Confirm Deletion">
          <div className="flex flex-col gap-4">
            <p>Are you sure you want to delete the tournament "{deletingTournament.name}"? This action cannot be undone and will delete all its teams, schedule, and scores.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeletingTournament(null)} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition">Cancel</button>
              <button onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition">Delete</button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default TournamentList;