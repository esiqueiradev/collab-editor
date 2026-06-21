export type Role = "VIEWER" | "EDITOR" | "OWNER";

export interface User {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface Collaborator {
  user: User;
  role: Role;
  joinedAt: string;
}

export interface Document {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  collaborators: Collaborator[];
}

export interface DocumentSnapshot {
  id: string;
  documentId: string;
  label: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
