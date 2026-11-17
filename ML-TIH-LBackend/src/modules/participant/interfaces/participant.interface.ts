import { AttendanceStatus } from '../dto/participant.dto';

export interface Participant {
  id: number;
  training_id: number;
  training: string | null;
  name: string;
  phone: string | null;
  age: number | null;
  caste: string | null;
  education: string | null;
  category: string | null;
  profile_image_url: string | null;
  attendance_status: AttendanceStatus;
  created_at: Date;
}

export interface ParticipantWithTrainingDetails extends Participant {
  training_details: {
    trainer_name: string | null;
    subject_name: string | null;
    location_details: {
      village: string | null;
      block: string | null;
      district: string | null;
      state: string | null;
      district_cd?: number | null;
      block_cd?: number | null;
      latitude: number | null;
      longitude: number | null;
    };
    start_date: Date | null;
  };
}
