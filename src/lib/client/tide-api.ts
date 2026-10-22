"use client";

import { IAMService } from "@tidecloak/js";

export class ApiError extends Error {
  constructor(message: string, public readonly code: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  if (!path.startsWith('/api/') || path.startsWith('//')) throw new Error('Only same-origin application APIs are allowed');
  const token = await IAMService.getToken();
  if (!token) throw new ApiError('Sign in to your Tide account first', 'UNAUTHENTICATED', 401);
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await IAMService.secureFetch(new URL(path, window.location.origin), {
    ...init, headers, cache: 'no-store', credentials: 'omit',
  });
  const body = await response.json();
  if (!response.ok) {
    throw new ApiError(typeof body.error === 'string' ? body.error : 'The request could not be completed',
      typeof body.code === 'string' ? body.code : 'REQUEST_FAILED', response.status);
  }
  return body as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}
