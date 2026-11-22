import { ApplicationStatus } from '../../domain/application-status.enum.js';

export interface ListOptions {
  page: number;
  limit: number;
  status?: ApplicationStatus;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
