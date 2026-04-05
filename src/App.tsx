import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { differenceInYears, parseISO, format } from 'date-fns';
import { db, handleFirestoreError, OperationType } from './firebase';
import Auth from './components/Auth';
import { Child, VaccineRecord, MicroAreaConfig } from './types';
import { VACCINE_SCHEDULE } from './constants/vaccines';
import { Baby, Search, Plus, AlertCircle, CheckCircle2, Filter, ChevronLeft, ChevronRight, Clock, MapPin, Lock, Unlock, Key, Download, Activity } from 'lucide-react';
import { ChildCard } from './components/ChildCard';
import { AddChildModal } from './components/AddChildModal';
import { ChildDetailModal } from './components/ChildDetailModal';
import { cn } from './lib/utils';

export default function App() {
  return (
    <Auth>
      {(user) => <Dashboard user={user} />}
    </Auth>
  );
}

const Dashboard = ({ user }: { user: User }) => {
  const adminEmails = ['najateste1993@gmail.com', 'najateste@gmail.com'];
  const isAdmin = user.email ? adminEmails.includes(user.email.toLowerCase()) : false;
  const [children, setChildren] = useState<Child[]>([]);
  const [vaccineRecords, setVaccineRecords] = useState<VaccineRecord[]>([]);
  const [microAreaConfigs, setMicroAreaConfigs] = useState<MicroAreaConfig[]>([]);
  const [unlockedAreas, setUnlockedAreas] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<{ area: string; mode: 'set' | 'unlock' } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAreaIndex, setActiveAreaIndex] = useState(0); // 0 is "Todas"
  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'F'>('all');
  const [ageRange, setAgeRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [microAreaSearch, setMicroAreaSearch] = useState('');
  const [adminAreaSearch, setAdminAreaSearch] = useState('');
  const [filterDelayed, setFilterDelayed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

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
    const childrenQuery = isAdmin 
      ? query(collection(db, 'children'))
      : query(collection(db, 'children'), where('ownerId', '==', user.uid));
    
    const unsubscribeChildren = onSnapshot(childrenQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Child));
      setChildren(data);
      setLoading(false);
      setIsSyncing(snapshot.metadata.fromCache);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'children'));

    const recordsQuery = isAdmin
      ? query(collection(db, 'vaccine_records'))
      : query(collection(db, 'vaccine_records'), where('ownerId', '==', user.uid));
    
    const unsubscribeRecords = onSnapshot(recordsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VaccineRecord));
      setVaccineRecords(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'vaccine_records'));

    const configsQuery = isAdmin
      ? query(collection(db, 'microarea_configs'))
      : query(collection(db, 'microarea_configs'), where('ownerId', '==', user.uid));
    
    const unsubscribeConfigs = onSnapshot(configsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MicroAreaConfig));
      setMicroAreaConfigs(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'microarea_configs'));

    return () => {
      unsubscribeChildren();
      unsubscribeRecords();
      unsubscribeConfigs();
    };
  }, [user.uid]);

  const getChildVaccineStatus = (childId: string) => {
    const childRecords = vaccineRecords.filter(r => r.childId === childId);
    const pending = childRecords.filter(r => r.status === 'pending').length;
    const delayed = childRecords.filter(r => r.status === 'delayed' || (r.status === 'pending' && new Date(r.dueDate) < new Date())).length;
    const applied = childRecords.filter(r => r.status === 'applied').length;
    return { pending, delayed, applied };
  };

  const filteredChildren = children.filter(child => {
    const matchesSearch = child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         child.motherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         child.susNumber.includes(searchTerm);
    
    const matchesGender = genderFilter === 'all' || child.gender === genderFilter;
    
    const age = differenceInYears(new Date(), parseISO(child.birthDate));
    const minAge = ageRange.min === '' ? -1 : parseInt(ageRange.min);
    const maxAge = ageRange.max === '' ? Infinity : parseInt(ageRange.max);
    
    const matchesAge = age >= minAge && age <= maxAge;

    const matchesMicroArea = !microAreaSearch || 
                            child.microArea.toLowerCase().includes(microAreaSearch.toLowerCase());

    if (!filterDelayed) return matchesSearch && matchesGender && matchesAge && matchesMicroArea;
    const { delayed } = getChildVaccineStatus(child.id);
    return matchesSearch && matchesGender && matchesAge && matchesMicroArea && delayed > 0;
  });

  const totalDelayed = vaccineRecords.filter(r => r.status === 'delayed' || (r.status === 'pending' && new Date(r.dueDate) < new Date())).length;
  
  const upcomingVaccines = vaccineRecords.filter(r => {
    if (r.status !== 'pending') return false;
    const dueDate = new Date(r.dueDate);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return dueDate >= today && dueDate <= nextWeek;
  });

  const totalUpcoming = upcomingVaccines.length;

  const groupedChildren = filteredChildren.reduce((acc, child) => {
    const area = child.microArea || 'Sem Microárea';
    if (!acc[area]) acc[area] = [];
    acc[area].push(child);
    return acc;
  }, {} as Record<string, Child[]>);

  const sortedAreas = Object.keys(groupedChildren).sort();
  const filteredSortedAreas = sortedAreas.filter(area => 
    area.toLowerCase().includes(adminAreaSearch.toLowerCase())
  );
  const allAreas = ['Todas', ...filteredSortedAreas];

  const currentArea = allAreas[activeAreaIndex] || 'Todas';
  const currentAreaConfig = microAreaConfigs.find(c => c.microArea === currentArea);
  const isAreaLocked = !isAdmin && currentArea !== 'Todas' && currentAreaConfig?.password && !unlockedAreas.has(currentArea);

  const displayedAreas = currentArea === 'Todas' 
    ? sortedAreas.filter(area => {
        if (isAdmin) return true;
        const config = microAreaConfigs.find(c => c.microArea === area);
        return !config?.password || unlockedAreas.has(area);
      })
    : isAreaLocked ? [] : [currentArea];

  // Ensure activeAreaIndex is within bounds when allAreas changes
  useEffect(() => {
    if (activeAreaIndex >= allAreas.length) {
      setActiveAreaIndex(0);
    }
  }, [allAreas.length, activeAreaIndex]);

  const handlePasswordSubmit = async () => {
    if (!isPasswordModalOpen) return;

    if (isPasswordModalOpen.mode === 'unlock') {
      if (currentAreaConfig?.password === passwordInput) {
        setUnlockedAreas(new Set([...unlockedAreas, isPasswordModalOpen.area]));
        setIsPasswordModalOpen(null);
        setPasswordInput('');
      } else {
        alert('Senha incorreta!');
      }
    } else {
      try {
        const configId = currentAreaConfig?.id || `${user.uid}_${isPasswordModalOpen.area}`;
        await setDoc(doc(db, 'microarea_configs', configId), {
          id: configId,
          microArea: isPasswordModalOpen.area,
          password: passwordInput,
          ownerId: currentAreaConfig?.ownerId || user.uid
        });
        if (passwordInput) {
          setUnlockedAreas(new Set([...unlockedAreas, isPasswordModalOpen.area]));
        } else {
          const newUnlocked = new Set(unlockedAreas);
          newUnlocked.delete(isPasswordModalOpen.area);
          setUnlockedAreas(newUnlocked);
        }
        setIsPasswordModalOpen(null);
        setPasswordInput('');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'microarea_configs');
      }
    }
  };

  const handleExportCSV = () => {
    if (!isAdmin) return;

    // Header for the CSV
    const headers = [
      'Nome da Criança',
      'Sexo',
      'Data de Nascimento',
      'Cartão SUS',
      'Nome da Mãe',
      'Microárea',
      'Bairro',
      'Endereço',
      'Nº Casa',
      'Vacina',
      'Dose',
      'Status',
      'Data Prevista',
      'Data Aplicada',
      'Unidade de Saúde'
    ];

    // Map records to CSV rows
    const rows = vaccineRecords.map(record => {
      const child = children.find(c => c.id === record.childId);
      const vaccineDef = VACCINE_SCHEDULE.find(v => v.id === record.vaccineId);
      
      return [
        child?.name || 'N/A',
        child?.gender || 'N/A',
        child?.birthDate || 'N/A',
        child?.susNumber || 'N/A',
        child?.motherName || 'N/A',
        child?.microArea || 'N/A',
        child?.neighborhood || 'N/A',
        child?.address || 'N/A',
        child?.houseNumber || 'N/A',
        vaccineDef?.name || 'N/A',
        record.dose,
        record.status === 'applied' ? 'Aplicada' : (new Date(record.dueDate) < new Date() ? 'Atrasada' : 'Pendente'),
        record.dueDate,
        record.dateApplied || '',
        record.healthUnit || ''
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `export_vacinas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const nextArea = () => {
    setActiveAreaIndex((prev) => (prev + 1) % allAreas.length);
  };

  const prevArea = () => {
    setActiveAreaIndex((prev) => (prev - 1 + allAreas.length) % allAreas.length);
  };

  const clearFilters = () => {
    setGenderFilter('all');
    setAgeRange({ min: '', max: '' });
    setMicroAreaSearch('');
    setFilterDelayed(false);
  };

  const activeFiltersCount = [
    genderFilter !== 'all',
    ageRange.min !== '' || ageRange.max !== '',
    microAreaSearch !== '',
    filterDelayed
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Notification Banner */}
      {totalUpcoming > 0 && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-lg">Atenção: Vacinas Próximas</h3>
              <p className="text-sm text-amber-700 font-medium">
                Existem <strong>{totalUpcoming}</strong> vacinas agendadas para os próximos 7 dias. Organize suas visitas!
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSearchTerm('')}
            className="hidden sm:block bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm"
          >
            Ver Todas
          </button>
        </div>
      )}

      {/* Offline/Sync Banner */}
      {!isOnline && (
        <div className="mb-8 bg-slate-800 text-white rounded-3xl p-5 flex items-center justify-between shadow-lg border border-slate-700 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-4">
            <div className="bg-slate-700 p-3 rounded-2xl text-amber-400">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Modo Offline Ativo</h3>
              <p className="text-sm text-slate-300 font-medium">
                Você pode continuar cadastrando e editando. Seus dados serão sincronizados automaticamente quando a internet voltar.
              </p>
            </div>
          </div>
        </div>
      )}

      {isOnline && isSyncing && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-3xl p-5 flex items-center justify-between shadow-sm animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
              <Activity className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Sincronizando Dados...</h3>
              <p className="text-sm text-blue-700 font-medium">
                Atualizando informações com o servidor para garantir que você tenha os dados mais recentes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-10">
        {[
          { label: 'Total de Crianças', value: children.length, icon: Baby, color: 'blue' },
          { label: 'Vacinas Atrasadas', value: totalDelayed, icon: AlertCircle, color: 'red' },
          { label: 'Próximos 7 Dias', value: totalUpcoming, icon: Clock, color: 'amber' },
          { label: isAdmin ? 'Modo Admin' : 'Microárea', value: isAdmin ? 'Total' : 'Ativa', icon: CheckCircle2, color: 'green' }
        ].map((stat, i) => (
          <div 
            key={stat.label}
            className="bg-white p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 flex items-center gap-3 sm:gap-5 hover:shadow-md transition-all"
          >
            <div className={cn(
              "p-2 sm:p-4 rounded-xl sm:rounded-2xl",
              stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
              stat.color === 'red' ? "bg-red-50 text-red-600" :
              stat.color === 'amber' ? "bg-amber-50 text-amber-600" :
              "bg-green-50 text-green-600"
            )}>
              <stat.icon className="w-5 h-5 sm:w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5 leading-tight">{stat.label}</p>
              <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Add */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Pesquisar por nome, cartão SUS ou mãe..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={cn(
              "flex items-center justify-center gap-2 font-bold py-4 px-6 rounded-2xl transition-all border shadow-sm",
              activeFiltersCount > 0 
                ? "bg-blue-50 border-blue-200 text-blue-600" 
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Filter className="w-5 h-5" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {isAdmin && (
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-black text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-slate-200"
              title="Exportar todos os dados para CSV"
            >
              <Download className="w-5 h-5" />
              Exportar CSV
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-5 h-5" />
            Cadastrar Criança
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                  <Filter className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Filtros</h3>
              </div>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Plus className="w-6 h-6 text-slate-400 rotate-45" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8">
              {/* Delayed Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status de Vacinação</label>
                <button
                  onClick={() => setFilterDelayed(!filterDelayed)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl transition-all border font-bold",
                    filterDelayed 
                      ? "bg-red-50 border-red-200 text-red-600" 
                      : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    Apenas Vacinas em Atraso
                  </div>
                  <div className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    filterDelayed ? "bg-red-600" : "bg-slate-300"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      filterDelayed ? "right-1" : "left-1"
                    )} />
                  </div>
                </button>
              </div>

              {/* Gender Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sexo</label>
                <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                  {[
                    { id: 'all', label: 'Todos', activeColor: 'bg-slate-800' },
                    { id: 'M', label: 'Masculino', activeColor: 'bg-blue-600' },
                    { id: 'F', label: 'Feminino', activeColor: 'bg-pink-600' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setGenderFilter(opt.id as any)}
                      className={cn(
                        "flex-1 py-3 text-xs font-bold rounded-xl transition-all",
                        genderFilter === opt.id ? `${opt.activeColor} text-white shadow-sm` : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Faixa Etária (Anos)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 ml-1">Mínimo</span>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm text-slate-900"
                      value={ageRange.min}
                      onChange={(e) => setAgeRange({ ...ageRange, min: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 ml-1">Máximo</span>
                    <input
                      type="number"
                      placeholder="12"
                      min="0"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm text-slate-900"
                      value={ageRange.max}
                      onChange={(e) => setAgeRange({ ...ageRange, max: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Microarea Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Microárea</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por microárea (ex: 01)..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm text-slate-900"
                    value={microAreaSearch}
                    onChange={(e) => {
                      setMicroAreaSearch(e.target.value);
                      setActiveAreaIndex(0);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button
                onClick={clearFilters}
                className="flex-1 py-4 px-6 bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all"
              >
                Limpar Filtro
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 py-4 px-6 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Micro-area Navigation */}
      {allAreas.length > 1 && (
        <div className="flex flex-col gap-6 mb-10">
          {isAdmin && (
            <div className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                <Search className="w-5 h-5" />
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Admin: Filtrar lista de microáreas..."
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm text-slate-900"
                  value={adminAreaSearch}
                  onChange={(e) => {
                    setAdminAreaSearch(e.target.value);
                    setActiveAreaIndex(0);
                  }}
                />
                {adminAreaSearch && (
                  <button
                    onClick={() => setAdminAreaSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-600 hover:bg-blue-100 px-2 py-1 rounded-lg transition-all"
                  >
                    LIMPAR
                  </button>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Busca Rápida de Áreas</p>
                <p className="text-xs font-bold text-slate-600">Encontre áreas para gerenciar senhas</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <button
              onClick={prevArea}
              className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all flex items-center gap-2 font-bold text-sm"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Microárea</span>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <span className={cn(
                    "px-6 py-2 rounded-2xl text-sm font-black transition-all shadow-sm flex items-center gap-2",
                    currentArea === 'Todas' ? "bg-blue-600 text-white" : "bg-slate-900 text-white"
                  )}>
                    {currentArea}
                    {currentArea !== 'Todas' && (
                      <button
                        onClick={() => setIsPasswordModalOpen({ area: currentArea, mode: 'set' })}
                        className="hover:text-blue-400 transition-colors flex items-center gap-1"
                      >
                        {currentAreaConfig?.password ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 opacity-30" />}
                        {isAdmin && currentAreaConfig?.password && <span className="text-[8px] font-bold opacity-50">Reset</span>}
                      </button>
                    )}
                  </span>
                </div>
                <span className="text-slate-400 text-xs font-bold">
                  {activeAreaIndex + 1} de {allAreas.length}
                </span>
              </div>
            </div>

            <button
              onClick={nextArea}
              className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all flex items-center gap-2 font-bold text-sm"
            >
              <span className="hidden sm:inline">Próximo</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Grouped Child List */}
      <div className="space-y-16">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-400 font-medium">Carregando dados...</p>
          </div>
        ) : isAreaLocked ? (
          <div className="bg-white border border-slate-200 rounded-[40px] p-20 text-center shadow-sm">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4">Microárea Protegida</h3>
            <p className="text-slate-500 font-medium mb-8">Esta área requer uma senha para visualização dos dados.</p>
            <button
              onClick={() => setIsPasswordModalOpen({ area: currentArea, mode: 'unlock' })}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest py-4 px-10 rounded-2xl transition-all shadow-lg shadow-blue-100"
            >
              Desbloquear Área
            </button>
          </div>
        ) : displayedAreas.length > 0 ? (
          displayedAreas.map((area) => (
            <div key={area} className="space-y-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <span className="bg-slate-900 text-white px-4 py-1.5 rounded-2xl text-sm font-mono tracking-wider">
                    {area}
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Crianças:</span>
                  <span className="text-sm font-black text-slate-900 bg-white border border-slate-200 px-4 py-1.5 rounded-2xl shadow-sm">
                    {groupedChildren[area]?.length || 0}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {groupedChildren[area]?.map(child => (
                  <ChildCard 
                    key={child.id} 
                    child={child} 
                    status={getChildVaccineStatus(child.id)}
                    onClick={() => setSelectedChild(child)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-20 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Baby className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Nenhuma criança encontrada</h3>
            <p className="text-slate-500 font-medium">Comece cadastrando uma criança na sua microárea.</p>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddChildModal 
          user={user} 
          onClose={() => setIsAddModalOpen(false)} 
        />
      )}
      {selectedChild && (
        <ChildDetailModal 
          child={selectedChild} 
          records={vaccineRecords.filter(r => r.childId === selectedChild.id)}
          onClose={() => setSelectedChild(null)}
          user={user}
        />
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden p-8">
            <div className="text-center mb-8">
              <div className="bg-blue-50 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                <Key className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                {isPasswordModalOpen.mode === 'unlock' ? 'Desbloquear Microárea' : (isAdmin ? 'Redefinir Senha (Admin)' : 'Configurar Senha')}
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                Microárea: <strong className="text-slate-900">{isPasswordModalOpen.area}</strong>
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha da Área</label>
                <input
                  type="password"
                  placeholder="Digite a senha..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 transition-all"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  autoFocus
                />
                {isPasswordModalOpen.mode === 'set' && (
                  <p className="text-[10px] text-slate-400 font-medium ml-1">Deixe em branco para remover a senha.</p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setIsPasswordModalOpen(null);
                    setPasswordInput('');
                  }}
                  className="flex-1 py-4 px-6 bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="flex-1 py-4 px-6 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  {isPasswordModalOpen.mode === 'unlock' ? 'Desbloquear' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
