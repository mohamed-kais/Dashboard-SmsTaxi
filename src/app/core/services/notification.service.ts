/**
 * Notification resource service — the "Notifications" tag of the notifications
 * backend OpenAPI spec (source of truth).
 *
 * Base URL: `environment.notificationsBaseUrl` — a DIFFERENT backend than the
 * main `apiBaseUrl`. Paths are built ABSOLUTE (`${base}/api/notifications/...`)
 * so the ApiBaseUrlInterceptor passes them through unchanged (it only prefixes
 * relative `/api/*` and `/taxi-client/api/*` paths).
 *
 * Read state is CLIENT-SIDE ONLY: the backend exposes no read/mark-read/unread
 * endpoints (documented gap). See `readIds$` / `markAsRead` below.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  NotificationDto,
  PageNotificationDto,
  SendNotificationRequest,
} from '../models/notification.model';

// ---------------------------------------------------------------------------
// Query param structs (exported so feature lanes / the topbar bell can call
// with plain object literals)
// ---------------------------------------------------------------------------

/** Query of `GET /api/notifications/all/filter` (Spring paging + free-text). */
export interface NotificationFilterQuery {
  /** 0-based page. */
  page?: number;
  /** page size. */
  size?: number;
  /** sort, e.g. `createdAt,desc`. */
  sort?: string;
  /** title free-text filter. */
  title?: string;
  /** message free-text filter. */
  message?: string;
}

/** Query of `GET /api/notifications/target/{targetType}` (Spring paging). */
export interface NotificationTargetQuery {
  /** 0-based page. */
  page?: number;
  /** page size. */
  size?: number;
  /** sort, e.g. `createdAt,desc`. */
  sort?: string;
}

/** localStorage key backing the client-side read-state set. */
const READ_IDS_KEY = 'smsTaxi.notification.readIds';

/** Seed the read-state set from localStorage (JSON array of number ids). */
function loadReadIds(): Set<number> {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    if (!raw) {
      return new Set<number>();
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set<number>(parsed)
      : new Set<number>();
  } catch {
    // Corrupt/unreadable payload — start clean (next mark*() repersists).
    return new Set<number>();
  }
}

/** One service per resource — `providedIn: 'root'`, HttpClient injected
 * directly, query params via HttpParams, typed Observable returns. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly baseUrl = environment.notificationsBaseUrl;

  /** Client-side read state (backend has no read endpoints — documented gap). */
  readonly readIds$ = new BehaviorSubject<Set<number>>(loadReadIds());

  constructor(private readonly http: HttpClient) {}

  /**
   * `GET ${base}/api/notifications/all` — every notification.
   */
  getAll(): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(`${this.baseUrl}/api/notifications/all`);
  }

  /**
   * `GET ${base}/api/notifications/all/filter` — paginated + free-text search.
   */
  getAllFiltered(query: NotificationFilterQuery = {}): Observable<PageNotificationDto> {
    const params = this.buildParams(query);
    return this.http.get<PageNotificationDto>(`${this.baseUrl}/api/notifications/all/filter`, {
      params,
    });
  }

  /**
   * `GET ${base}/api/notifications/client/{clientId}` — notifications for a client.
   */
  getByClient(clientId: number): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(
      `${this.baseUrl}/api/notifications/client/${clientId}`
    );
  }

  /**
   * `GET ${base}/api/notifications/taxi/{taxiId}` — notifications for a taxi.
   */
  getByTaxi(taxiId: number): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(
      `${this.baseUrl}/api/notifications/taxi/${taxiId}`
    );
  }

  /**
   * `GET ${base}/api/notifications/target-notif/${targetType}` — notifications
   * by target type (unpaged).
   */
  getByTargetType(targetType: string): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(
      `${this.baseUrl}/api/notifications/target-notif/${encodeURIComponent(targetType)}`
    );
  }

  /**
   * `GET ${base}/api/notifications/target/${targetType}` — paginated by target
   * type.
   *
   * NOTE — spec quirk: the swagger declares the 200 response as a SINGLE
   * `NotificationDto`, but the backend (and every other list endpoint) returns
   * an array — documented doc-bug. Normalized defensively below.
   */
  getByTargetTypeFiltered(
    targetType: string,
    query: NotificationTargetQuery = {}
  ): Observable<NotificationDto[]> {
    const params = this.buildParams(query);
    return this.http
      .get<NotificationDto | NotificationDto[]>(
        `${this.baseUrl}/api/notifications/target/${encodeURIComponent(targetType)}`,
        { params }
      )
      .pipe(
        map((response) => {
          if (Array.isArray(response)) {
            return response;
          }
          if (response) {
            return [response];
          }
          return [];
        })
      );
  }

  /**
   * `POST ${base}/api/notifications/send` — broadcast / targeted send.
   */
  send(request: SendNotificationRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/api/notifications/send`, request);
  }

  /**
   * `POST ${base}/api/notifications/send-any-one` — send to arbitrary phones.
   */
  sendAnyOne(request: SendNotificationRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/api/notifications/send-any-one`, request);
  }

  /**
   * Convenience — latest notifications for a target type, newest first
   * (delegates to `getByTargetTypeFiltered` with `createdAt,desc` sort).
   */
  getLatestByTarget(targetType: string, page = 0, size = 5): Observable<NotificationDto[]> {
    return this.getByTargetTypeFiltered(targetType, {
      page,
      size,
      sort: 'createdAt,desc',
    });
  }

  // -------------------------------------------------------------------------
  // Client-side read state (no backend read endpoints exist)
  // -------------------------------------------------------------------------

  /** Mark one notification as read (persists to localStorage, emits). */
  markAsRead(id: number): void {
    const next = new Set(this.readIds$.value);
    next.add(id);
    this.persistReadIds(next);
    this.readIds$.next(next);
  }

  /** Mark several notifications as read (persists to localStorage, emits). */
  markAllAsRead(ids: number[]): void {
    const next = new Set(this.readIds$.value);
    ids.forEach((id) => next.add(id));
    this.persistReadIds(next);
    this.readIds$.next(next);
  }

  /** Sync getter — is the notification id in the read set? */
  isRead(id: number): boolean {
    return this.readIds$.value.has(id);
  }

  /** Count of notifications whose id is NOT in the read set. */
  unreadCount(notifications: NotificationDto[]): number {
    return notifications.filter((n) => !this.readIds$.value.has(n.id)).length;
  }

  /** Shared HttpParams builder for the paging query structs. */
  private buildParams(query: NotificationFilterQuery | NotificationTargetQuery): HttpParams {
    let params = new HttpParams();
    if (query.page != null) {
      params = params.set('page', String(query.page));
    }
    if (query.size != null) {
      params = params.set('size', String(query.size));
    }
    if (query.sort) {
      params = params.set('sort', query.sort);
    }
    if ('title' in query && query.title) {
      params = params.set('title', query.title);
    }
    if ('message' in query && query.message) {
      params = params.set('message', query.message);
    }
    return params;
  }

  private persistReadIds(ids: Set<number>): void {
    try {
      localStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids]));
    } catch {
      // localStorage unavailable — read state stays in-memory only for this session.
    }
  }
}