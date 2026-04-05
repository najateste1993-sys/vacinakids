import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signIn, logout } from '../firebase';
import { LogIn, LogOut, User as UserIcon, ShieldCheck, Baby, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Auth({ children }: { children: (user: User) => React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="bg-blue-600 p-4 rounded-[24px] shadow-xl shadow-blue-100 mb-6 animate-pulse">
          <Activity className="w-10 h-10 text-white" />
        </div>
        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Iniciando Sistema...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-blue-600 p-2 sm:p-2.5 rounded-2xl shadow-lg shadow-blue-100 rotate-3">
              <Baby className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">VacinaKids <span className="text-blue-600">ACS</span></span>
              <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Painel de Controle</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
            {!isOnline && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest border border-amber-200 animate-pulse">
                <Activity className="w-3 h-3" />
                Offline
              </div>
            )}
            {user ? (
              <>
                <div className="text-right flex flex-col justify-center">
                  <p className="text-xs sm:text-sm font-black text-slate-900 tracking-tight line-clamp-1">{user.displayName}</p>
                  <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1">{user.email}</p>
                </div>
                <div className="h-8 w-[1px] bg-slate-100" />
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all border border-red-100 group active:scale-95"
                  title="Sair do Sistema"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-0.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Sair</span>
                </button>
              </>
            ) : (
              <button
                onClick={signIn}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                Entrar
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={cn(!user && "flex flex-col items-center justify-center p-6 relative overflow-hidden min-h-[calc(100vh-5rem)]")}>
        {!user ? (
          <>
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full -mr-64 -mt-64 blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-50 rounded-full -ml-48 -mb-48 blur-3xl opacity-50" />

            <div className="w-full max-w-md bg-white rounded-[48px] shadow-2xl shadow-slate-200/50 p-12 text-center relative z-10 border border-slate-100">
              <div className="relative inline-block mb-10">
                <div className="bg-blue-600 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-blue-200 rotate-6">
                  <Baby className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-lg border border-slate-50 -rotate-12">
                  <ShieldCheck className="w-6 h-6 text-green-500" />
                </div>
              </div>

              <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">VacinaKids <span className="text-blue-600">ACS</span></h1>
              <p className="text-slate-400 font-bold text-sm mb-12 leading-relaxed px-4">
                Gestão inteligente de vacinação para Agentes Comunitários de Saúde.
              </p>

              <button
                onClick={signIn}
                className="w-full flex items-center justify-center gap-4 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] py-5 px-8 rounded-[24px] transition-all shadow-xl shadow-slate-200 hover:-translate-y-1 active:translate-y-0"
              >
                <LogIn className="w-5 h-5" />
                Acessar com Google
              </button>
              
              <p className="mt-10 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Desenvolvido para o SUS • 2026
              </p>
            </div>
          </>
        ) : (
          children(user)
        )}
      </main>
    </div>
  );
}
