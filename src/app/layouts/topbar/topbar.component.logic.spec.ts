import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';

import { TopbarComponent } from './topbar.component';
import { CookieService } from 'ngx-cookie-service';
import { LanguageService } from '../../core/services/language.service';
import { EventService } from '../../core/services/event.service';
import { LoaderService } from '../../core/services/loader.service';
import { AuthenticationService } from '../../core/services/auth.service';
import { AuthfakeauthenticationService } from '../../core/services/authfake.service';
import { UserProfileService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationDto } from '../../core/models/notification.model';

describe('TopbarComponent (logic)', () => {
  let fixture: ComponentFixture<TopbarComponent>;
  let component: TopbarComponent;
  let notifMock: {
    readIds$: BehaviorSubject<Set<number>>;
    getLatestByTarget: jasmine.Spy;
    isRead: jasmine.Spy;
    markAsRead: jasmine.Spy;
  };

  const notif = (id: number, type: NotificationDto['type'] = 'INFO'): NotificationDto => ({
    id,
    title: `N${id}`,
    type,
    createdAt: '2026-01-01T10:00:00Z',
  });

  beforeEach(() => {
    notifMock = {
      readIds$: new BehaviorSubject<Set<number>>(new Set([1])),
      getLatestByTarget: jasmine.createSpy('getLatestByTarget').and.callFake(() => of([notif(2)])),
      isRead: jasmine.createSpy('isRead').and.callFake((id: number) => notifMock.readIds$.value.has(id)),
      markAsRead: jasmine.createSpy('markAsRead').and.callFake((id: number) =>
        notifMock.readIds$.next(new Set([...notifMock.readIds$.value, id]))
      ),
    };

    TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideTranslateService(),
        CookieService,
        LanguageService,
        EventService,
        LoaderService,
        AuthenticationService,
        AuthfakeauthenticationService,
        UserProfileService,
        { provide: NotificationService, useValue: notifMock },
      ],
    });
    fixture = TestBed.createComponent(TopbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the 5 most recent ADMIN notifications on init and derives the unread count', () => {
    expect(notifMock.getLatestByTarget).toHaveBeenCalledWith('ADMIN', 0, 5);
    expect(component.recentNotifications).toEqual([notif(2)]);
    const counts: number[] = [];
    component.unreadCount$.subscribe((c) => counts.push(c));
    // 1 unread-able notification (id 2) and 1 already-read id (1): count = 1.
    expect(counts.at(-1)).toBe(1);
  });

  it('unread count reacts to local read-state changes', () => {
    const counts: number[] = [];
    component.unreadCount$.subscribe((c) => counts.push(c));
    notifMock.readIds$.next(new Set([1, 2]));
    expect(counts.at(-1)).toBe(0);
  });

  it('onNotificationsOpen refreshes only once when list is stale; not on close or when fresh', () => {
    expect(notifMock.getLatestByTarget).toHaveBeenCalledTimes(1); // init
    component.onNotificationsOpen(false);
    expect(notifMock.getLatestByTarget).toHaveBeenCalledTimes(1);
    component.onNotificationsOpen(true);
    // listFresh is still true after the init load → no reload.
    expect(notifMock.getLatestByTarget).toHaveBeenCalledTimes(1);

    (component as unknown as { listFresh: boolean }).listFresh = false;
    component.onNotificationsOpen(true);
    expect(notifMock.getLatestByTarget).toHaveBeenCalledTimes(2);
    component.onNotificationsOpen(true);
    expect(notifMock.getLatestByTarget).toHaveBeenCalledTimes(2);
  });

  it('loadRecentNotifications is guarded while a load is in flight', () => {
    component.loadingNotifications = true;
    component.loadRecentNotifications();
    expect(notifMock.getLatestByTarget).toHaveBeenCalledTimes(1);
  });

  it('loadRecentNotifications clears the loading flag on error', () => {
    const err = new BehaviorSubject<NotificationDto[]>([] as NotificationDto[]);
    notifMock.getLatestByTarget.and.callFake(() => err.asObservable());
    component.loadRecentNotifications();
    err.error(new Error('boom'));
    expect(component.loadingNotifications).toBeFalse();
    expect(component.recentNotifications).toEqual([]);
  });

  it('onNotificationClick marks an unread notification; already-read ones are skipped', () => {
    component.onNotificationClick(notif(2));
    expect(notifMock.markAsRead).toHaveBeenCalledWith(2);
    component.onNotificationClick(notif(1));
    expect(notifMock.markAsRead).toHaveBeenCalledTimes(1);
  });

  it('setLanguage updates the displayed flag/name/cookie internals and delegates to LanguageService', () => {
    const langSpy = spyOn(component.languageService, 'setLanguage');
    component.setLanguage('French', 'fr', 'assets/images/flags/french.jpg');
    expect(component.countryName).toBe('French');
    expect(component.flagvalue).toBe('assets/images/flags/french.jpg');
    expect(component.cookieValue).toBe('fr');
    expect(langSpy).toHaveBeenCalledWith('fr');
  });

  it('notificationAvatarClass / notificationAvatarIcon map severity', () => {
    expect(component.notificationAvatarClass(notif(1, 'ERROR'))).toBe('bg-danger');
    expect(component.notificationAvatarClass(notif(1, 'WARNING'))).toBe('bg-warning');
    expect(component.notificationAvatarClass(notif(1))).toBe('bg-primary');
    expect(component.notificationAvatarIcon(notif(1, 'ERROR'))).toBe('bx bx-error-circle');
    expect(component.notificationAvatarIcon(notif(1, 'WARNING'))).toBe('bx bx-error');
    expect(component.notificationAvatarIcon(notif(1))).toBe('bx bx-bell');
  });

  describe('notificationTime', () => {
    let instant: jasmine.Spy;

    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2026-01-01T12:00:00'));
      instant = spyOn(component.translate, 'instant').and.callFake((key: string) => `[${key}]`);
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('handles empty/invalid timestamps', () => {
      expect(component.notificationTime(undefined)).toBe('');
      expect(component.notificationTime('')).toBe('');
      expect(component.notificationTime('not-a-date')).toBe('not-a-date');
    });

    it('formats future dates with toLocaleString and keeps pinned translations as-is', () => {
      const out = component.notificationTime('2026-01-01T12:30:00');
      expect(out).toBe(new Date('2026-01-01T12:30:00').toLocaleString());
    });

    it('formats relative labels under 24h', () => {
      expect(component.notificationTime('2026-01-01T11:59:30')).toBe('[layout.topbar.justNow]');
      expect(component.notificationTime('2026-01-01T11:59:00')).toBe('1[layout.topbar.minAgo]');
      expect(component.notificationTime('2026-01-01T11:55:00')).toBe('5[layout.topbar.minsAgo]');
      expect(component.notificationTime('2026-01-01T11:00:00')).toBe('1[layout.topbar.hourAgo]');
      expect(component.notificationTime('2026-01-01T10:00:00')).toBe('2[layout.topbar.hoursAgo]');
      expect(component.notificationTime('2025-12-31T12:00:00')).toBe(
        new Date('2025-12-31T12:00:00').toLocaleString()
      );
    });
  });
});