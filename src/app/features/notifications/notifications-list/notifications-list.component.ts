import { Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subject, Subscription, debounceTime, merge, switchMap, tap } from 'rxjs';
import Swal from 'sweetalert2';

import { NgbdSortableHeader, SortEvent } from '../../../core/directives/sortable.directive';
import {
  NOTIFICATION_TYPE,
  StatusBadge,
  statusBadge,
} from '../../../core/constants/status-badges';
import {
  NotificationDto,
  NotificationType,
  PageNotificationDto,
} from '../../../core/models/notification.model';
import {
  NotificationFilterQuery,
  NotificationService,
} from '../../../core/services/notification.service';
import { TableState, createTableState } from '../../../core/utils/table-state';
import { apiErrorMessage } from '../notifications.constants';

/**
 * Notifications list — paginated / sortable admin table over
 * `GET /api/notifications/all/filter` (server-side paging + free-text search).
 *
 * Server-side pipeline (pattern: demands-list): filter changes (debounced) and
 * reload triggers are merged, then `switchMap`'d into
 * `NotificationService.getAllFiltered()`; the Spring page response drives rows
 * + totals. Default sort `createdAt,desc`.
 *
 * Read state is client-side only (see NotificationService): unread rows are
 * tinted, clicking a row marks it read, and "Mark all read" marks every row on
 * the current page.
 */
@Component({
    selector: 'app-notifications-list',
    templateUrl: './notifications-list.component.html',
    styleUrls: ['./notifications-list.component.scss'],
    standalone: false
})
export class NotificationsListComponent implements OnInit, OnDestroy {
  readonly breadcrumb: { label: string; active: boolean }[] = [
    { label: 'Alerts', active: false },
    { label: 'Notifications', active: true },
  ];

  pageSizes = [10, 20, 50];

  filter = {
    title: '',
    message: '',
  };

  state: TableState<NotificationDto> = createTableState<NotificationDto>({
    pageSize: 10,
    sortColumn: 'createdAt',
    sortDirection: 'desc',
  });
  loading = false;
  error = '';

  @ViewChildren(NgbdSortableHeader) headers?: QueryList<NgbdSortableHeader>;

  private readonly reload$ = new BehaviorSubject<void>(undefined);
  private readonly filterChange$ = new Subject<void>();
  private readonly sub = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.sub.add(
      merge(this.reload$, this.filterChange$.pipe(debounceTime(300)))
        .pipe(
          tap(() => {
            this.loading = true;
            this.error = '';
          }),
          switchMap(() => this.notificationService.getAllFiltered(this.buildParams()))
        )
        .subscribe({
          next: (page) => this.applyPage(page),
          error: (err) => {
            this.loading = false;
            this.error = apiErrorMessage(err) || this.translate.instant('notification.list.loadError');
          },
        })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ---------------------------------------------------------------------------
  // Filters / sort / pagination
  // ---------------------------------------------------------------------------

  /** Title/message filter changes re-run the search on page 1 (debounced). */
  applyFilters(): void {
    this.state.page = 1;
    this.filterChange$.next();
  }

  resetFilters(): void {
    this.filter = { title: '', message: '' };
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.state.page = page;
    this.reload$.next();
  }

  onPageSizeChange(size: number): void {
    this.state.pageSize = size;
    this.state.page = 1;
    this.reload$.next();
  }

  onSort({ column, direction }: SortEvent): void {
    this.headers?.forEach((h) => {
      if (h.sortable !== column) {
        h.direction = '';
      }
    });
    this.state.sortColumn = column;
    this.state.sortDirection = direction;
    this.state.page = 1;
    this.reload$.next();
  }

  directionFor(column: string): '' | 'asc' | 'desc' {
    if (this.state.sortColumn !== column || !this.state.sortDirection) {
      return '';
    }
    return this.state.sortDirection;
  }

  // ---------------------------------------------------------------------------
  // Read state (client-side only — see NotificationService)
  // ---------------------------------------------------------------------------

  /** Clicking a row marks it read and drops the unread styling via readIds$. */
  onRowClick(row: NotificationDto): void {
    if (!this.notificationService.isRead(row.id)) {
      this.notificationService.markAsRead(row.id);
    }
  }

  isUnread(row: NotificationDto): boolean {
    return !this.notificationService.isRead(row.id);
  }

  /** Unread rows on the current page (drives the "Mark all read" affordance). */
  unreadOnPage(): number {
    return this.state.rows.filter((r) => !this.notificationService.isRead(r.id)).length;
  }

  /** Mark every notification on the current page as read. */
  markAllRead(): void {
    const ids = this.state.rows.map((r) => r.id);
    if (!ids.length) {
      return;
    }
    this.notificationService.markAllAsRead(ids);
    Swal.fire(
      this.translate.instant('notification.list.markedAsReadTitle'),
      this.translate.instant('notification.list.markedAsReadDetail', {
        count: ids.length,
        plural: ids.length === 1 ? '' : 's',
      }),
      'success'
    );
  }

  // ---------------------------------------------------------------------------
  // Display helpers
  // ---------------------------------------------------------------------------

  /** Title fallback — use `#id` when the backend returned no title. */
  title(row: NotificationDto): string {
    return row.title?.trim() ? row.title : `#${row.id}`;
  }

  /** Type badge via the shared scheme (plan §7). */
  badge(type?: NotificationType): StatusBadge {
    if (!type) {
      return { label: 'UNKNOWN', class: 'badge-soft-secondary' };
    }
    return statusBadge(type, NOTIFICATION_TYPE);
  }

  // ---------------------------------------------------------------------------
  // Pipeline helpers
  // ---------------------------------------------------------------------------

  private buildParams(): NotificationFilterQuery {
    return {
      // API page is 0-based; TableState.page is 1-based (template pattern).
      page: this.state.page - 1,
      size: this.state.pageSize,
      sort:
        this.state.sortColumn && this.state.sortDirection
          ? `${this.state.sortColumn},${this.state.sortDirection}`
          : 'createdAt,desc',
      title: this.filter.title.trim() || undefined,
      message: this.filter.message.trim() || undefined,
    };
  }

  private applyPage(page: PageNotificationDto): void {
    const rows = page?.content ?? [];
    this.state.rows = rows;
    this.state.filteredRows = rows;
    this.state.totalRecords = page?.totalElements ?? rows.length;
    this.state.startIndex =
      this.state.totalRecords === 0 ? 0 : (this.state.page - 1) * this.state.pageSize + 1;
    this.state.endIndex = Math.min(this.state.page * this.state.pageSize, this.state.totalRecords);
    // The server's 0-based `number` is the truth (clamps us if we paged past the end).
    if (typeof page?.number === 'number') {
      this.state.page = page.number + 1;
    }
    this.loading = false;
  }
}