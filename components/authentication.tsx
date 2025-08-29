import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      alert('Check your email for the login link!');
    } catch (error: any) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-sky-400 mb-2">VolleyManager</h1>
                <p className="text-slate-400">Sign in to manage your tournaments</p>
            </div>
            <div className="bg-slate-800 rounded-lg shadow-xl p-8">
                <form onSubmit={handleLogin}>
                    <div className="flex flex-col gap-4">
                        <input
                            className="bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                            type="email"
                            placeholder="Your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button 
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md transition" 
                            disabled={loading}
                        >
                            {loading ? <span>Sending...</span> : <span>Send magic link</span>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
}