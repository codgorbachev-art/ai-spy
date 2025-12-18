import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from '../../types';
import { LogOut, Send, Lock } from 'lucide-react';

export const ProfileView: React.FC<{ user: User; onLogout: () => void; onUpdateUser: (u: User) => void }> = ({ user, onLogout, onUpdateUser }) => {
  const [newAllergy, setNewAllergy] = useState('');

  const addAllergy = () => {
    const trimmed = newAllergy.trim();
    if (trimmed && !user.allergies.includes(trimmed)) {
      onUpdateUser({
        ...user,
        allergies: [...user.allergies, trimmed]
      });
      setNewAllergy('');
    }
  };

  const removeAllergy = (tag: string) => {
    onUpdateUser({
      ...user,
      allergies: user.allergies.filter(a => a !== tag)
    });
  };

  const toggleSetting = (key: 'notifications') => {
    onUpdateUser({
      ...user,
      settings: {
        ...user.settings,
        [key]: !user.settings[key]
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto w-full glass-panel p-8 rounded-3xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-cyan to-brand-purple flex items-center justify-center text-2xl font-bold shadow-[0_0_20px_rgba(112,0,255,0.3)] overflow-hidden border-2 border-white/20">
          {user.photoUrl ? (
             <img src={user.photoUrl} alt="User" className="w-full h-full object-cover" />
          ) : (
             <span className="text-white">{user.name.charAt(0)}</span>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          {user.username && <p className="text-brand-cyan text-sm mb-1">@{user.username}</p>}
          <p className="text-gray-400 text-sm">{user.email || 'No email linked'}</p>
          <div className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 font-bold">
            {user.plan} MEMBER
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-mono text-gray-500 uppercase mb-3">Мои Аллергены</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {user.allergies.map((tag: string) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm flex items-center gap-2 group hover:border-red-500/50 transition-colors text-gray-200">
                {tag} <button onClick={() => removeAllergy(tag)} className="group-hover:text-red-500 transition-colors">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
              placeholder="Добавить аллерген..."
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-cyan/50 focus:outline-none"
            />
            <button onClick={addAllergy} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors text-white">
              +
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-mono text-gray-500 uppercase mb-3">Настройки</h3>
          <div className="space-y-2">
             <div 
               className="flex justify-between items-center p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
               onClick={() => toggleSetting('notifications')}
             >
                <div className="flex items-center gap-3">
                  <Send className="w-4 h-4 text-brand-purple" />
                  <span className="text-white">Уведомления в Telegram</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${user.settings.notifications ? 'bg-brand-cyan/40' : 'bg-white/10'}`}>
                   <motion.div 
                     initial={false}
                     animate={{ x: user.settings.notifications ? 20 : 2 }}
                     className={`absolute top-1 w-3 h-3 rounded-full shadow-md ${user.settings.notifications ? 'bg-brand-cyan' : 'bg-gray-400'}`} 
                   />
                </div>
             </div>
             {/* Locked Setting Demo */}
             <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-3">
                   <Lock className="w-4 h-4 text-gray-500" />
                   <span className="text-gray-400">Экспорт данных (PRO)</span>
                </div>
             </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10">
          <button onClick={onLogout} className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" /> Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
};