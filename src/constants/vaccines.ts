import { VaccineDefinition } from '../types';

export const VACCINE_SCHEDULE: VaccineDefinition[] = [
  { id: 'bcg', name: 'BCG', dose: 'Única', recommendedAgeMonths: 0, description: 'Previne formas graves de tuberculose' },
  { id: 'hepb_birth', name: 'Hepatite B', dose: 'Nascimento', recommendedAgeMonths: 0, description: 'Previne hepatite B' },
  
  { id: 'penta_1', name: 'Pentavalente', dose: '1ª Dose', recommendedAgeMonths: 2, description: 'Difteria, tétano, coqueluche, hepatite B e Hib' },
  { id: 'vip_1', name: 'VIP (Poliomielite)', dose: '1ª Dose', recommendedAgeMonths: 2, description: 'Previne paralisia infantil' },
  { id: 'pneu_1', name: 'Pneumocócica 10V', dose: '1ª Dose', recommendedAgeMonths: 2, description: 'Previne pneumonia, otite e meningite' },
  { id: 'rota_1', name: 'Rotavírus', dose: '1ª Dose', recommendedAgeMonths: 2, description: 'Previne diarreia por rotavírus' },
  
  { id: 'meningo_c_1', name: 'Meningocócica C', dose: '1ª Dose', recommendedAgeMonths: 3, description: 'Previne meningite C' },
  
  { id: 'penta_2', name: 'Pentavalente', dose: '2ª Dose', recommendedAgeMonths: 4, description: 'Difteria, tétano, coqueluche, hepatite B e Hib' },
  { id: 'vip_2', name: 'VIP (Poliomielite)', dose: '2ª Dose', recommendedAgeMonths: 4, description: 'Previne paralisia infantil' },
  { id: 'pneu_2', name: 'Pneumocócica 10V', dose: '2ª Dose', recommendedAgeMonths: 4, description: 'Previne pneumonia, otite e meningite' },
  { id: 'rota_2', name: 'Rotavírus', dose: '2ª Dose', recommendedAgeMonths: 4, description: 'Previne diarreia por rotavírus' },
  
  { id: 'meningo_c_2', name: 'Meningocócica C', dose: '2ª Dose', recommendedAgeMonths: 5, description: 'Previne meningite C' },
  
  { id: 'penta_3', name: 'Pentavalente', dose: '3ª Dose', recommendedAgeMonths: 6, description: 'Difteria, tétano, coqueluche, hepatite B e Hib' },
  { id: 'vip_3', name: 'VIP (Poliomielite)', dose: '3ª Dose', recommendedAgeMonths: 6, description: 'Previne paralisia infantil' },
  
  { id: 'f_amarela_1', name: 'Febre Amarela', dose: '1ª Dose', recommendedAgeMonths: 9, description: 'Previne febre amarela' },
  
  { id: 'triplice_viral_1', name: 'Tríplice Viral', dose: '1ª Dose', recommendedAgeMonths: 12, description: 'Sarampo, caxumba e rubéola' },
  { id: 'pneu_ref', name: 'Pneumocócica 10V', dose: 'Reforço', recommendedAgeMonths: 12, description: 'Reforço contra pneumonia' },
  { id: 'meningo_c_ref', name: 'Meningocócica C', dose: 'Reforço', recommendedAgeMonths: 12, description: 'Reforço contra meningite C' },
  
  { id: 'dtp_ref_1', name: 'DTP', dose: '1º Reforço', recommendedAgeMonths: 15, description: 'Difteria, tétano e coqueluche' },
  { id: 'vop_ref_1', name: 'VOP (Poliomielite)', dose: '1º Reforço', recommendedAgeMonths: 15, description: 'Reforço paralisia infantil' },
  { id: 'hepa', name: 'Hepatite A', dose: 'Única', recommendedAgeMonths: 15, description: 'Previne hepatite A' },
  { id: 'tetraviral', name: 'Tetraviral', dose: 'Única', recommendedAgeMonths: 15, description: 'Sarampo, caxumba, rubéola e varicela' },
  
  { id: 'dtp_ref_2', name: 'DTP', dose: '2º Reforço', recommendedAgeMonths: 48, description: 'Difteria, tétano e coqueluche (4 anos)' },
  { id: 'vop_ref_2', name: 'VOP (Poliomielite)', dose: '2º Reforço', recommendedAgeMonths: 48, description: 'Reforço paralisia infantil (4 anos)' },
  { id: 'f_amarela_ref', name: 'Febre Amarela', dose: 'Reforço', recommendedAgeMonths: 48, description: 'Reforço febre amarela (4 anos)' },
  { id: 'varicela', name: 'Varicela', dose: '2ª Dose', recommendedAgeMonths: 48, description: 'Previne catapora (4 anos)' },
  
  { id: 'hpv_1', name: 'HPV', dose: '1ª Dose', recommendedAgeMonths: 108, description: 'Previne câncer de colo de útero e verrugas genitais (9-14 anos)' },
  { id: 'meningo_acwy', name: 'Meningocócica ACWY', dose: 'Única', recommendedAgeMonths: 132, description: 'Previne meningites A, C, W e Y (11-12 anos)' },
];
