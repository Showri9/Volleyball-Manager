
import React from 'react';
import type { Standing } from '../types';

interface StandingsViewProps {
  standings: Standing[];
}

const StandingsView: React.FC<StandingsViewProps> = ({ standings }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-sky-400 mb-6">Standings</h2>
      <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Rank</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Team</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">W</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">L</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Sets (W-L)</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Points (For-Against)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {standings.length > 0 ? standings.map((standing, index) => (
                <tr key={standing.team.id} className="hover:bg-slate-700/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-sky-400">{standing.team.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">{standing.wins}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-400">{standing.losses}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-300">{standing.setsWon} - {standing.setsLost}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-300">{standing.pointsFor} - {standing.pointsAgainst}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">No match data available to calculate standings.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StandingsView;
