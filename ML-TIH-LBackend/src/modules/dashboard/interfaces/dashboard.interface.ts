export interface DashboardSummary {
  total_trainers: number;
  total_subjects: number;
  total_locations: number;
  total_trainings: number;
  total_participants: number;
  active_trainings: number;
  completed_trainings: number;
  scheduled_trainings: number;
}

export interface TrainingStats {
  by_status: {
    scheduled: number;
    ongoing: number;
    completed: number;
    cancelled: number;
  };
  by_subject: Array<{
    subject_name: string;
    count: number;
  }>;
  by_location: Array<{
    district: string;
    count: number;
  }>;
}

export interface ParticipantStats {
  by_category: Array<{
    category: string;
    count: number;
  }>;
  by_caste: Array<{
    caste: string;
    count: number;
  }>;
  by_education: Array<{
    education: string;
    count: number;
  }>;
  attendance_stats: {
    present: number;
    absent: number;
    late: number;
  };
}
