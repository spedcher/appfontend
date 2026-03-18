export interface User {
  id?: number;
  username: string;
  passwordHash: string;
  email: string;
  createdAt?: string;
  status: 'active' | 'inactive' | 'banned';
}
