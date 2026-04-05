import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { X, Baby, Trash2, Edit2, CheckCircle2, AlertCircle, Clock, Calendar, MapPin, Heart, User as UserIcon, Search, Save, RotateCcw, ChevronLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Child, VaccineRecord } from '../types';
import { VACCINE_SCHEDULE } from '../constants/vaccines';
import { cn } from '../lib/utils';

interface ChildDetailModalProps {
  child: Child;
  records: VaccineRecord[];
  onClose: () => void;
  user: User;
}

export function ChildDetailModal({ child, records, onClose, user }: ChildDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'vaccines'>('vaccines');
  const [editingRecord, setEditingRecord] = useState<VaccineRecord | null>(null);
  const [vaccineFilter, setVaccineFilter] = useState<'all' | 'applied' | 'pending' | 'delayed'>('all');
  const [ageGroupFilter, setAgeGroupFilter] = useState<number | 'all'>('all');
  const [vaccineSearchTerm, setVaccineSearchTerm] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: child.name,
    motherName: child.motherName,
    birthDate: child.birthDate,
    susNumber: child.susNumber,
    microArea: child.microArea || '',
    neighborhood: child.neighborhood || '',
    address: child.address || '',
    houseNumber: child.houseNumber || '',
    gender: child.gender
  });

  const isMale = editFormData.gender === 'M';

  const sortedRecords = [...(records || [])].sort((a, b) => {
    const defA = VACCINE_SCHEDULE.find(v => v.id === a.vaccineId);
    const defB = VACCINE_SCHEDULE.find(v => v.id === b.vaccineId);
    return (defA?.recommendedAgeMonths || 0) - (defB?.recommendedAgeMonths || 0);
  });

  const filteredRecords = sortedRecords.filter(record => {
    const def = VACCINE_SCHEDULE.find(v => v.id === record.vaccineId);
    const isDelayed = record.status === 'pending' && new Date(record.dueDate) < new Date();
    
    const matchesStatus = vaccineFilter === 'all' || 
                         (vaccineFilter === 'applied' && record.status === 'applied') ||
                         (vaccineFilter === 'pending' && record.status === 'pending' && !isDelayed) ||
                         (vaccineFilter === 'delayed' && isDelayed);
    
    const matchesAgeGroup = ageGroupFilter === 'all' || def?.recommendedAgeMonths === ageGroupFilter;

    const matchesSearch = !vaccineSearchTerm || 
                         def?.name.toLowerCase().includes(vaccineSearchTerm.toLowerCase());

    return matchesStatus && matchesAgeGroup && matchesSearch;
  });

  const ageGroups = Array.from(new Set(VACCINE_SCHEDULE.map(v => v.recommendedAgeMonths))).sort((a, b) => a - b);

  const handleUpdateStatus = async (record: VaccineRecord, status: 'applied' | 'pending' | 'delayed', date?: string, healthUnit?: string) => {
    try {
      await updateDoc(doc(db, 'vaccine_records', record.id), {
        status,
        dateApplied: date || null,
        healthUnit: healthUnit || null,
        updatedAt: serverTimestamp()
      });
      setEditingRecord(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'vaccine_records');
    }
  };

  const handleSaveInfo = async () => {
    try {
      await updateDoc(doc(db, 'children', child.id), {
        ...editFormData,
        updatedAt: serverTimestamp()
      });
      setIsEditingInfo(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'children');
    }
  };

  const handleDeleteChild = async () => {
    try {
      await deleteDoc(doc(db, 'children', child.id));
      const deletePromises = records.map(r => deleteDoc(doc(db, 'vaccine_records', r.id)));
      await Promise.all(deletePromises);
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'children');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] sm:p-4">
      <div className="bg-white w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-[40px] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className={cn(
          "px-6 sm:px-8 py-6 sm:py-8 flex justify-between items-start relative overflow-hidden",
          isMale ? "bg-blue-600" : "bg-pink-600"
        )}>
          {/* Mobile Back Button */}
          <button 
            onClick={onClose}
            className="sm:hidden absolute top-4 left-4 flex items-center gap-1 px-3 py-2 bg-white/20 backdrop-blur-md rounded-xl text-white z-20 border border-white/30 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>

          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl" />

          <div className="flex items-center gap-4 sm:gap-6 relative z-10 pt-4 sm:pt-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg border border-white/30">
              <Baby className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div className="text-white">
              {isEditingInfo ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    className="bg-white/20 border border-white/30 rounded-xl px-3 py-1 text-2xl font-black text-white outline-none focus:ring-2 focus:ring-white/50 w-full"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="bg-white/20 border border-white/30 rounded-lg px-2 py-0.5 text-xs font-black text-white outline-none focus:ring-2 focus:ring-white/50"
                      value={editFormData.susNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, susNumber: e.target.value })}
                      placeholder="SUS"
                    />
                    <select
                      className="bg-white/20 border border-white/30 rounded-lg px-2 py-0.5 text-xs font-black text-white outline-none focus:ring-2 focus:ring-white/50"
                      value={editFormData.gender}
                      onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as 'M' | 'F' })}
                    >
                      <option value="M" className="text-slate-900">Masc.</option>
                      <option value="F" className="text-slate-900">Fem.</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-black tracking-tight mb-1">{editFormData.name}</h2>
                  <div className="flex items-center gap-3 opacity-90">
                    <span className="bg-white/20 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest">SUS: {editFormData.susNumber}</span>
                    <span className="flex items-center gap-1 text-xs font-bold">
                      <Heart className="w-3 h-3 fill-current" />
                      {isMale ? 'Masculino' : 'Feminino'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative z-10">
            <button 
              onClick={onClose} 
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/20 flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              <span className="sm:hidden text-[10px] font-black uppercase tracking-widest">Fechar</span>
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex px-8 bg-white border-b border-slate-100">
          {[
            { id: 'vaccines', label: 'Caderneta de Vacinação', icon: CheckCircle2 },
            { id: 'info', label: 'Informações Gerais', icon: UserIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 py-6 px-4 text-sm font-black transition-all border-b-4 relative",
                activeTab === tab.id 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 pb-32 sm:pb-8 scrollbar-hide">
          {activeTab === 'info' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Dados Cadastrais</h3>
                {!isEditingInfo ? (
                  <button
                    onClick={() => setIsEditingInfo(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black transition-all"
                  >
                    <Edit2 className="w-3 h-3" />
                    EDITAR DADOS
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditingInfo(false);
                        setEditFormData({
                          name: child.name,
                          motherName: child.motherName,
                          birthDate: child.birthDate,
                          susNumber: child.susNumber,
                          microArea: child.microArea || '',
                          neighborhood: child.neighborhood || '',
                          address: child.address || '',
                          houseNumber: child.houseNumber || '',
                          gender: child.gender
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black transition-all"
                    >
                      <RotateCcw className="w-3 h-3" />
                      CANCELAR
                    </button>
                    <button
                      onClick={handleSaveInfo}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-100"
                    >
                      <Save className="w-3 h-3" />
                      SALVAR ALTERAÇÕES
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 'motherName', label: 'Nome da Mãe', value: editFormData.motherName, icon: Heart, color: 'pink', type: 'text' },
                  { id: 'birthDate', label: 'Data de Nascimento', value: editFormData.birthDate, icon: Calendar, color: 'blue', type: 'date' },
                  { id: 'microArea', label: 'Microárea', value: editFormData.microArea, icon: MapPin, color: 'amber', type: 'text' },
                  { id: 'neighborhood', label: 'Bairro', value: editFormData.neighborhood, icon: MapPin, color: 'green', type: 'text' },
                  { id: 'address', label: 'Endereço', value: editFormData.address, icon: MapPin, color: 'green', type: 'text' },
                  { id: 'houseNumber', label: 'Número da Casa', value: editFormData.houseNumber, icon: MapPin, color: 'slate', type: 'text' }
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "p-2 rounded-xl",
                        item.color === 'pink' ? "bg-pink-100 text-pink-600" :
                        item.color === 'blue' ? "bg-blue-100 text-blue-600" :
                        item.color === 'amber' ? "bg-amber-100 text-amber-600" :
                        item.color === 'green' ? "bg-green-100 text-green-600" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                    </div>
                    {isEditingInfo ? (
                      <input
                        type={item.type}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={item.value}
                        onChange={(e) => setEditFormData({ ...editFormData, [item.id]: e.target.value })}
                      />
                    ) : (
                      <p className="text-slate-900 font-black text-lg">
                        {item.id === 'birthDate' 
                          ? format(parseISO(item.value), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : item.value || 'Não informado'}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Destructive Action Section */}
              <div className="mt-12 pt-8 border-t border-slate-100">
                <div className="bg-red-50/50 p-6 sm:p-8 rounded-[40px] border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="text-center sm:text-left">
                    <h4 className="text-lg font-black text-red-900 mb-1">Zona de Perigo</h4>
                    <p className="text-sm text-red-600/70 font-medium">A exclusão do registro é permanente e removerá todos os dados e vacinas.</p>
                  </div>
                  <button
                    onClick={() => setIsConfirmingDelete(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-red-100 active:scale-95"
                  >
                    <Trash2 className="w-5 h-5" />
                    Excluir Registro da Criança
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Filters Section */}
              <div className="space-y-6">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Buscar vacina pelo nome..."
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm text-slate-900 transition-all"
                    value={vaccineSearchTerm}
                    onChange={(e) => setVaccineSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-[24px]">
                  {[
                    { id: 'all', label: 'Todas', color: 'bg-slate-800' },
                    { id: 'applied', label: 'Aplicadas', color: 'bg-green-600' },
                    { id: 'pending', label: 'Pendentes', color: 'bg-blue-600' },
                    { id: 'delayed', label: 'Atrasadas', color: 'bg-red-600' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setVaccineFilter(f.id as any)}
                      className={cn(
                        "flex-1 px-4 py-3 text-xs font-black rounded-2xl transition-all",
                        vaccineFilter === f.id ? `${f.color} text-white shadow-lg` : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Idade:</span>
                  <button
                    onClick={() => setAgeGroupFilter('all')}
                    className={cn(
                      "px-5 py-2 text-[10px] font-black rounded-xl border transition-all whitespace-nowrap",
                      ageGroupFilter === 'all' ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                    )}
                  >
                    TODAS
                  </button>
                  {ageGroups.map(age => (
                    <button
                      key={age}
                      onClick={() => setAgeGroupFilter(age)}
                      className={cn(
                        "px-5 py-2 text-[10px] font-black rounded-xl border transition-all whitespace-nowrap",
                        ageGroupFilter === age ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                      )}
                    >
                      {age === 0 ? 'AO NASCER' : `${age} MESES`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vaccine List */}
              <div className="grid grid-cols-1 gap-4">
                {(filteredRecords || []).length > 0 ? (
                  (filteredRecords || []).map((record) => {
                    const def = VACCINE_SCHEDULE.find(v => v.id === record.vaccineId);
                    const isDelayed = record.status === 'pending' && new Date(record.dueDate) < new Date();
                    
                    return (
                      <div 
                        key={record.id}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 rounded-[32px] border transition-all group gap-4",
                          record.status === 'applied' ? "bg-green-50/50 border-green-100" : 
                          isDelayed ? "bg-red-50 border-red-200 ring-2 ring-red-500/10 shadow-lg shadow-red-100/50" : "bg-white border-slate-200 hover:shadow-md"
                        )}
                      >
                        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                          <div className={cn(
                            "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm",
                            record.status === 'applied' ? "bg-green-100 text-green-600" : 
                            isDelayed ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"
                          )}>
                            {record.status === 'applied' ? <CheckCircle2 className="w-7 h-7" /> : 
                             isDelayed ? <AlertCircle className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-black text-slate-900">{def?.name}</h4>
                              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase">{record.dose}</span>
                              {isDelayed && (
                                <span className="text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded-md uppercase animate-pulse">ATRASADA</span>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {record.status === 'applied' ? 
                                  `Aplicada em ${format(parseISO(record.dateApplied!), 'dd/MM/yyyy')}` : 
                                  `Prevista para ${format(parseISO(record.dueDate), 'dd/MM/yyyy')}`}
                              </p>
                              {isDelayed && (
                                <p className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-0.5">
                                  <AlertCircle className="w-3 h-3" />
                                  Vacina com prazo de aplicação vencido!
                                </p>
                              )}
                              {record.healthUnit && (
                                <p className="text-[10px] font-black text-blue-600 flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded-lg w-fit">
                                  <MapPin className="w-3 h-3" />
                                  {record.healthUnit}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center sm:justify-end gap-3 w-full sm:w-auto">
                          {record.status !== 'applied' ? (
                            <button
                              onClick={() => setEditingRecord(record)}
                              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest py-3.5 sm:py-3 px-6 rounded-2xl transition-all shadow-lg shadow-blue-100 active:scale-95"
                            >
                              Marcar Aplicada
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <button
                                onClick={() => setEditingRecord(record)}
                                className="text-blue-600 hover:text-blue-700 p-3 bg-blue-50 rounded-xl transition-all"
                                title="Editar registro"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(record, 'pending')}
                                className="text-slate-300 hover:text-slate-600 p-3 bg-slate-50 rounded-xl transition-all"
                                title="Desmarcar aplicação"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-black text-sm uppercase tracking-widest">Nenhuma vacina encontrada</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Apply Vaccine Modal Overlay */}
        {editingRecord && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-[70]">
            <div className="w-full max-w-sm text-center">
              <div className="bg-blue-100 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-100">
                <CheckCircle2 className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Confirmar Aplicação</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium px-4">
                Informe a data em que a vacina <strong>{VACCINE_SCHEDULE.find(v => v.id === editingRecord.vaccineId)?.name}</strong> foi aplicada.
              </p>
              <div className="space-y-4">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data da Aplicação</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="date" 
                      defaultValue={editingRecord.dateApplied || format(new Date(), 'yyyy-MM-dd')}
                      id="apply-date"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade de Saúde</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      defaultValue={editingRecord.healthUnit || ''}
                      id="health-unit"
                      placeholder="Ex: UBS Centro"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setEditingRecord(null)}
                    className="flex-1 py-4 px-6 bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      const date = (document.getElementById('apply-date') as HTMLInputElement).value;
                      const healthUnit = (document.getElementById('health-unit') as HTMLInputElement).value;
                      handleUpdateStatus(editingRecord, 'applied', date, healthUnit);
                    }}
                    className="flex-1 py-4 px-6 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Mobile Floating Close Button */}
        <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-full px-6">
          <button
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all border border-white/10"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar para a Lista
          </button>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden p-8 text-center animate-in zoom-in duration-200">
            <div className="bg-red-50 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Excluir Registro?</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              Você está prestes a excluir permanentemente o registro de <strong className="text-slate-900">{child.name}</strong> e toda a sua caderneta de vacinação. Esta ação não pode ser desfeita.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeleteChild}
                className="w-full py-4 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95"
              >
                Sim, Excluir Permanentemente
              </button>
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="w-full py-4 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
