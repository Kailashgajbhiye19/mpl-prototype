export interface AdminUser {
  id: number;
  username: string;
  email: string;
  name: string;
  created_at: Date;
  last_login: Date | null;
  is_active: boolean;
}

export interface AdminCredentials extends AdminUser {
  password_hash: string;
}

export interface AdminPasswordRecord {
  id: number;
  password_hash: string;
}
