import React from 'react';
import { Baby, Calendar, ChevronRight, User as UserIcon, AlertCircle, Clock } from 'lucide-react';
import { differenceInMonths, parseISO } from 'date-fns';
import { Child } from '../types';
import { cn } from '../lib/utils';

interface ChildCardProps {
  child: Child;
  status: {
    pending: number;
    delayed: number;
    applied: number;
  };
  onClick: () => void;
}

export const ChildCard: React.FC<ChildCardProps> = ({ child, status, onClick }) => {
  const isMale = child.gender === 'M';
  const ageMonths = differenceInMonths(new Date(), parseISO(child.birthDate));
  const ageDisplay = ageMonths < 1 ? 'Recém-nascido' : 
                    ageMonths < 12 ? `${ageMonths} meses` : 
                    `${Math.floor(ageMonths / 12)} anos e ${ageMonths % 12} meses`;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-200 cursor-pointer hover:shadow-xl hover:border-blue-200 transition-all group relative overflow-hidden"
    >
      {/* Gender Accent Bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1.5",
        isMale ? "bg-blue-500" : "bg-pink-500"
      )} />

      <div className="flex items-start justify-between mb-6">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner transition-colors",
          isMale ? "bg-blue-50 text-blue-600 group-hover:bg-blue-100" : "bg-pink-50 text-pink-600 group-hover:bg-pink-100"
        )}>
          <Baby className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-2 items-end">
          {status.delayed > 0 && (
            <div className="bg-red-50 text-red-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-red-100 shadow-sm">
              <AlertCircle className="w-3 h-3" />
              {status.delayed} ATRASADA{status.delayed > 1 ? 'S' : ''}
            </div>
          )}
          {status.pending > 0 && (
            <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-amber-100 shadow-sm">
              <Clock className="w-3 h-3" />
              {status.pending} PENDENTE{status.pending > 1 ? 'S' : ''}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {child.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <div className={cn(
              "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter",
              isMale ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
            )}>
              {isMale ? 'Masculino' : 'Feminino'}
            </div>
            <span className="text-xs text-slate-400 font-medium">SUS: {child.susNumber}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold">{ageDisplay}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
        </div>
      </div>

      {/* Hover Effect Background */}
      <div className={cn(
        "absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity",
        isMale ? "text-blue-600" : "text-pink-600"
      )}>
        <UserIcon className="w-full h-full" />
      </div>
    </div>
  );
};
