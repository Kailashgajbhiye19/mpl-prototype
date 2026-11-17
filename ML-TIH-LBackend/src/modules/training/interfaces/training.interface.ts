import { TrainingStatus } from '../dto/training.dto';

export interface Training {
  id: number;
  trainer_id: number;
  subject_id: number;
  location_id: number;
  start_date: Date | string;
  end_date?: Date | string | null;
  max_participants: number;
  actual_participants: number;
  status: TrainingStatus;
  training_type?: string | null;
  created_at: Date;
}

export interface TrainingWithDetails extends Training {
  trainer_name: string | null;
  subject_name: string | null;
  location_details: {
    village?: string | null;
    block?: string | null;
    district?: string | null;
    state?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    address_line?: string | null;
  };
  total_participants: number;
}

export interface TrainingWithNames {
  id: number;
  trainer_id: number;
  subject_id: number;
  location_id: number;
  start_date: Date;
  end_date: Date | null;
  max_participants: number;
  actual_participants: number;
  status: string;
  training_type?: string | null;
  created_at: Date;

  trainer_name: string | null;
  trainer_profile_image?: string | null;

  subject_name: string | null;

  location_details: {
    village: string | null;
    block: string | null;
    district: string | null;
    state: string | null;
    latitude: number | null;
    longitude: number | null;
    address_line: string | null;
  };

  total_participants: number;
}
