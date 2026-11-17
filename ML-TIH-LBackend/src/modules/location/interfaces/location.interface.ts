export interface Location {
  id: number;
  village?: string | null;
  block?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address_line?: string | null;
  district_cd?: number | null;
  block_cd?: number | null;
  created_at: Date;
}

export interface LocationWithStats extends Location {
  total_trainings: number;
}
