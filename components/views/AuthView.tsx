import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types';
import ButtonGlow from '../ui/ButtonGlow';
import { Send, Mail } from 'lucide-react';

// Declaration for Telegram Widget Global Callback
declare global {
  interface Window {
    onTelegramAuth: (user: any) => void;
  }
}

export const AuthView: React.FC<{ onLogin: (user?: Partial<User>) => void; onSwitchMode: () => void }> = ({ onLogin, onSwitchMode }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'telegram' | 'email'>('telegram');

  useEffect(() => {
    // Only load the script if we are in Telegram mode
    if (mode === 'telegram') {
      window.onTelegramAuth = (user) => {
        onLogin({
          telegramId: user.id.toString(),
          name: user.first_name + (user.last_name ? ' ' + user.last_name : ''),
          username: user.username,
          photoUrl: user.photo_url,
        });
      };

      const script = document.createElement('script');
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.async = true;
      script.setAttribute('data-telegram-login', 'labelspy_bot'); 
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '12');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');

      const container = document.getElementById('telegram-login-container');
      if (container) {
        container.innerHTML = ''; // Clear previous
        container.appendChild(script);
      }
    }
  }, [mode, onLogin]);

  // Handle Real-ish Email Registration
  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if(!email || !name) return;

    setLoading(true);
    
    // Simulate API Latency
    setTimeout(() => {
      onLogin({ 
        email, 
        name,
        // Generate a mock ID
        id: Math.random().toString(36).substr(2, 9)
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full mx-auto mt-10 glass-panel p-8 rounded-3xl relative overflow-hidden border-t border-white/10"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-cyan to-brand-purple" />
      
      <div className="text-center mb-8">
         <h2 className="text-2xl font-bold text-white mb-2">Вход в Purescan</h2>
         <p className="text-gray-400 text-sm">Выберите удобный способ авторизации</p>
      </div>

      <div className="flex gap-2 p-1 bg-black/40 rounded-xl mb-8 border border-white/10">
         <button 
           onClick={() => setMode('telegram')}
           className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'telegram' ? 'bg-brand-cyan/20 text-brand-cyan shadow-lg border border-brand-cyan/20' : 'text-gray-400 hover:text-white'}`}
         >
           <Send className="w-4 h-4" /> Telegram
         </button>
         <button 
           onClick={() => setMode('email')}
           className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'email' ? 'bg-brand-purple/20 text-brand-purple shadow-lg border border-brand-purple/20' : 'text-gray-400 hover:text-white'}`}
         >
           <Mail className="w-4 h-4" /> Email
         </button>
      </div>

      <div className="min-h-[250px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {mode === 'telegram' ? (
             <motion.div 
               key="telegram"
               initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
               className="flex flex-col items-center justify-center space-y-6"
             >
                <div id="telegram-login-container" className="flex justify-center min-h-[50px]" />
                <p className="text-xs text-center text-gray-500 max-w-xs">
                   Используйте официальный виджет Telegram для быстрого и безопасного входа.
                </p>
             </motion.div>
          ) : (
            <motion.div 
              key="email"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            >
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-500 mb-1 ml-1 uppercase">Имя</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ваше имя"
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-brand-purple/50 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-500 mb-1 ml-1 uppercase">Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-brand-purple/50 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <ButtonGlow type="submit" isLoading={loading} className="w-full !border-brand-purple/30 hover:!border-brand-purple/60 hover:!shadow-[0_0_20px_rgba(112,0,255,0.3)] !text-white">
                    {loading ? 'Создание аккаунта...' : 'Продолжить'}
                  </ButtonGlow>
                </div>
                <p className="text-[10px] text-center text-gray-600 mt-2">
                  Нажимая продолжить, вы соглашаетесь с условиями использования.
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};