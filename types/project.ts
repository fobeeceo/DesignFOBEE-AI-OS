export type ProjectStatus =
  | "UPLOADED"
  | "ANALYZING"
  | "ANALYZED"
  | "DESIGNED"
  | "ESTIMATED"
  | "CONSULTED";

export interface SpacePhoto {
  id: string;
  projectId: string;
  storagePath: string;
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface Project {
  id: string;
  profileId: string;
  title?: string | null;
  status: ProjectStatus;
  photos: SpacePhoto[];
  createdAt: string;
  updatedAt: string;
}
