export interface Trainer {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
  created_at: Date;
}

export interface TrainerWithStats extends Trainer {
  total_trainings: number;
  total_participants: number;
}
