export interface Child {
  id: string;
  name: string;
  birthDate: string;
  motherName: string;
  susNumber: string;
  address: string;
  neighborhood: string;
  houseNumber: string;
  microArea: string;
  gender: 'M' | 'F';
  createdAt: string;
  updatedAt: string;
}

export interface VaccineRecord {
  id: string;
  childId: string;
  vaccineId: string;
  dose: string;
  status: 'applied' | 'pending' | 'delayed';
  dateApplied?: string;
  dueDate: string;
  batch?: string;
  healthUnit?: string;
}

export interface VaccineDefinition {
  id: string;
  name: string;
  dose: string;
  recommendedAgeMonths: number;
  description: string;
}

export interface MicroAreaConfig {
  id: string;
  microArea: string;
  password?: string;
  ownerId: string;
}
