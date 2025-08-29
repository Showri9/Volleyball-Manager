import type { Tournament } from '../types';

const TOURNAMENTS_STORAGE_KEY = 'tournaments_v2';

export const saveTournamentsToLocalStorage = (tournaments: Tournament[]): void => {
    try {
        const data = JSON.stringify(tournaments);
        localStorage.setItem(TOURNAMENTS_STORAGE_KEY, data);
    } catch (error) {
        console.error("Failed to save tournaments to localStorage", error);
    }
};

export const loadTournamentsFromLocalStorage = (): Tournament[] => {
    try {
        const saved = localStorage.getItem(TOURNAMENTS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Failed to parse tournaments from localStorage", error);
        return [];
    }
};
