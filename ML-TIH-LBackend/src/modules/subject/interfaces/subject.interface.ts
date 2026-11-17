export interface Subject {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
}

export interface SubjectWithStats extends Subject {
  total_trainings: number;
}
