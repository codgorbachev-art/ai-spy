import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from '../../types';
import { LogOut, Send, Lock, Moon, Sun, Bell } from 'lucide-react';

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
      allergies: user.allergies.filter((a: string) => a !== tag)
    });
  };

  const toggleSetting = (key: 'notifications' | 'darkMode') => {
    const updatedUser = {
      ...user,
      settings: {
        ...user.settings,
        [key]: !user.settings[key]
      }
    };
    onUpdateUser(updatedUser);
  };

  return (
    <div className="max-w-2xl mx-auto w-full glass-panel p-8 rounded-3xl transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex items-center gap-6 mb-10 pb-6 border-b border-gray-200 dark:border-white/10">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-cyan to-brand-purple flex items-center justify-center text-3xl font-bold shadow-[0_5px_20px_rgba(112,0,255,0.3)] overflow-hidden border-2 border-white/50 dark:border-white/20">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt="User" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white">{user.name.charAt(0)}</span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-[#050505] shadow-sm" title="Online" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
          {user.username && <p className="text-brand-purple dark:text-brand-cyan text-sm mb-1 font-medium">@{user.username}</p>}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{user.email || 'Email not linked'}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
               user.plan === 'ULTRA' ? 'bg-gradient-to-r from-brand-cyan/20 to-brand-purple/20 text-brand-purple dark:text-brand-cyan border-brand-cyan/30' : 
               'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10'
            }`}>
              {user.plan} MEMBER
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* ALLERGIES SECTION */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Мои Аллергены</h3>
          <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-4 border border-gray-200 dark:border-white/5">
            <div className="flex flex-wrap gap-2 mb-4">
              {user.allergies.map((tag: string) => (
                <motion.span 
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={tag} 
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm flex items-center gap-2 group hover:border-red-500/50 hover:bg-red-500/5 transition-all text-gray-700 dark:text-gray-200 shadow-sm"
                >
                  {tag} 
                  <button onClick={() => removeAllergy(tag)} className="text-gray-400 group-hover:text-red-500 transition-colors bg-transparent p-0.5 rounded-full hover:bg-red-500/10">
                    ×
                  </button>
                </motion.span>
              ))}
              {user.allergies.length === 0 && (
                 <span className="text-sm text-gray-400 italic py-1">Список пуст</span>
              )}
            </div>
            <div className="flex gap-2 relative">
              <input 
                type="text" 
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
                placeholder="Например: Глютен, Орехи..."
                className="flex-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 focus:outline-none transition-all shadow-sm"
              />
              <button 
                onClick={addAllergy} 
                disabled={!newAllergy.trim()}
                className="px-4 py-2 bg-gray-900 dark:bg-white/10 rounded-xl text-white hover:bg-brand-purple hover:dark:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* SETTINGS SECTION */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Настройки приложения</h3>
          <div className="space-y-3">
             {/* Notification Toggle */}
             <div 
               className="flex justify-between items-center p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 cursor-pointer hover:border-brand-cyan/30 transition-all shadow-sm group"
               onClick={() => toggleSetting('notifications')}
             >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl transition-colors ${user.settings.notifications ? 'bg-brand-purple/10 text-brand-purple' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                     <span className="block text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-purple transition-colors">Уведомления</span>
                     <span className="text-xs text-gray-500">Получать отчеты в Telegram</span>
                  </div>
                </div>
                
                {/* Custom Toggle Switch */}
                <div className={`w-12 h-7 rounded-full relative transition-colors duration-300 ease-in-out ${user.settings.notifications ? 'bg-brand-purple' : 'bg-gray-200 dark:bg-gray-700'}`}>
                   <motion.div 
                     layout
                     initial={false}
                     animate={{ x: user.settings.notifications ? 22 : 2 }}
                     transition={{ type: "spring", stiffness: 500, damping: 30 }}
                     className="absolute top-1 w-5 h-5 rounded-full shadow-md bg-white" 
                   />
                </div>
             </div>

             {/* Dark Mode Toggle */}
             <div 
               className="flex justify-between items-center p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 cursor-pointer hover:border-brand-cyan/30 transition-all shadow-sm group"
               onClick={() => toggleSetting('darkMode')}
             >
                <div className="flex items-center gap-4">
                   <div className={`p-2 rounded-xl transition-colors ${user.settings.darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-500'}`}>
                    {user.settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                     <span className="block text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-cyan transition-colors">Тема оформления</span>
                     <span className="text-xs text-gray-500">{user.settings.darkMode ? 'Темная (Deep Space)' : 'Светлая (Clean Air)'}</span>
                  </div>
                </div>
                
                 {/* Custom Toggle Switch */}
                <div className={`w-12 h-7 rounded-full relative transition-colors duration-300 ease-in-out ${user.settings.darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                   <motion.div 
                     layout
                     initial={false}
                     animate={{ x: user.settings.darkMode ? 22 : 2 }}
                     transition={{ type: "spring", stiffness: 500, damping: 30 }}
                     className="absolute top-1 w-5 h-5 rounded-full shadow-md bg-white flex items-center justify-center" 
                   >
                     {/* Tiny icon inside toggle for extra flair */}
                     {user.settings.darkMode ? <Moon size={10} className="text-blue-600" /> : <Sun size={10} className="text-orange-500" />}
                   </motion.div>
                </div>
             </div>

             {/* Locked Setting */}
             <div className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent opacity-60 cursor-not-allowed">
                <div className="flex items-center gap-4">
                   <div className="p-2 rounded-xl bg-gray-200 dark:bg-white/5 text-gray-400">
                      <Lock className="w-5 h-5" />
                   </div>
                   <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Экспорт данных (Доступно в PRO)</span>
                </div>
             </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 dark:border-white/10">
          <button onClick={onLogout} className="w-full py-3 rounded-xl border border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 font-medium text-sm">
            <LogOut className="w-4 h-4" /> Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
};