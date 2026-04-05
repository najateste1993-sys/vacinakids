import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { X, Baby, User as UserIcon, Calendar, CreditCard, MapPin, Heart, Plus } from 'lucide-react';
import { format, parseISO, addMonths } from 'date-fns';
import { VACCINE_SCHEDULE } from '../constants/vaccines';
import { cn } from '../lib/utils';

interface AddChildModalProps {
  user: User;
  onClose: () => void;
}

export function AddChildModal({ user, onClose }: AddChildModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    motherName: '',
    susNumber: '',
    neighborhood: '',
    address: '',
    houseNumber: '',
    microArea: '',
    gender: 'M' as 'M' | 'F'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const childRef = await addDoc(collection(db, 'children'), {
        ...formData,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const birthDate = parseISO(formData.birthDate);
      const recordsPromises = VACCINE_SCHEDULE.map(v => {
        const dueDate = addMonths(birthDate, v.recommendedAgeMonths);
        return addDoc(collection(db, 'vaccine_records'), {
          childId: childRef.id,
          vaccineId: v.id,
          dose: v.dose,
          status: 'pending',
          dueDate: format(dueDate, 'yyyy-MM-dd'),
          ownerId: user.uid
        });
      });
      await Promise.all(recordsPromises);
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'children');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cadastrar Criança</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Novo Registro de Saúde</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-2xl transition-all text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome Completo */}
              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <UserIcon className="w-3 h-3" />
                  Nome Completo
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: João Silva Santos"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <Calendar className="w-3 h-3" />
                  Data de Nascimento
                </label>
                <input
                  required
                  type="date"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 transition-all"
                  value={formData.birthDate}
                  onChange={e => setFormData({...formData, birthDate: e.target.value})}
                />
              </div>

              {/* Sexo */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <Heart className="w-3 h-3" />
                  Sexo
                </label>
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, gender: 'M'})}
                    className={cn(
                      "flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest",
                      formData.gender === 'M' ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Masculino
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, gender: 'F'})}
                    className={cn(
                      "flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest",
                      formData.gender === 'F' ? "bg-pink-600 text-white shadow-lg shadow-pink-100" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Feminino
                  </button>
                </div>
              </div>

              {/* Cartão SUS */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <CreditCard className="w-3 h-3" />
                  Cartão SUS
                </label>
                <input
                  required
                  type="text"
                  maxLength={15}
                  placeholder="000 0000 0000 0000"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 transition-all"
                  value={formData.susNumber}
                  onChange={e => setFormData({...formData, susNumber: e.target.value})}
                />
              </div>

              {/* Nome da Mãe */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <Heart className="w-3 h-3" />
                  Nome da Mãe
                </label>
                <input
                  required
                  type="text"
                  placeholder="Nome completo da mãe"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 transition-all"
                  value={formData.motherName}
                  onChange={e => setFormData({...formData, motherName: e.target.value})}
                />
              </div>

              {/* Microárea */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <MapPin className="w-3 h-3" />
                  Microárea
                </label>
                <input
                  type="text"
                  placeholder="Ex: 01"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 transition-all"
                  value={formData.microArea}
                  onChange={e => setFormData({...formData, microArea: e.target.value})}
                />
              </div>

              {/* Bairro */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <MapPin className="w-3 h-3" />
                  Bairro
                </label>
                <input
                  type="text"
                  placeholder="Ex: Centro"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 transition-all"
                  value={formData.neighborhood}
                  onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                />
              </div>

              {/* Endereço */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <MapPin className="w-3 h-3" />
                  Endereço
                </label>
                <input
                  type="text"
                  placeholder="Rua, logradouro"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 transition-all"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>

              {/* Número da Casa */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <MapPin className="w-3 h-3" />
                  Número da Casa
                </label>
                <input
                  type="text"
                  placeholder="Ex: 123"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 transition-all"
                  value={formData.houseNumber}
                  onChange={e => setFormData({...formData, houseNumber: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-5 px-6 bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-5 px-6 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {submitting ? 'Salvando...' : 'Cadastrar Criança'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
