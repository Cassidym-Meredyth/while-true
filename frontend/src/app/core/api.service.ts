import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.tokens';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  private url(path: string) {
    const left = this.baseUrl.replace(/\/+$/, '');
    const right = path.replace(/^\/+/, '');
    return `${left}/${right}`;
  }

  get<T>(path: string, params?: Record<string, any>): Observable<T> {
    return this.http.get<T>(this.url(path), {
      params: params ? new HttpParams({ fromObject: params }) : undefined,
    });
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(this.url(path), body);
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(this.url(path), body);
  }

  patch<T>(path: string, body: any): Observable<T> {
    return this.http.patch<T>(this.url(path), body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }
}
