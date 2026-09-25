import { Component, OnInit, Output, EventEmitter, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthenticationService } from '../../core/services/auth.service';
import { AuthfakeauthenticationService } from '../../core/services/authfake.service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationDto } from '../../core/models/notification.model';
import { environment } from '../../../environments/environment';
import { CookieService } from 'ngx-cookie-service';
import { LanguageService } from '../../core/services/language.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})

/**
 * Topbar component
 */
export class TopbarComponent implements OnInit {

  element;
  cookieValue;
  flagvalue;
  countryName;
  valueset;

  constructor(@Inject(DOCUMENT) private document: any, private router: Router, private authService: AuthenticationService,
              private authFackservice: AuthfakeauthenticationService,
              public languageService: LanguageService,
              public translate: TranslateService,
              public _cookiesService: CookieService,
              public notificationService: NotificationService) {
  }

  /** Latest ADMIN notifications for the bell dropdown (newest first). */
  recentNotifications: NotificationDto[] = [];
  loadingNotifications = false;
  /** Reactive unread count — badge + styling stay in sync with client-side read state. */
  unreadCount$: Observable<number>;
  private readonly notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
  private listFresh = false;

  listLang = [
    { text: 'English', flag: 'assets/images/flags/us.jpg', lang: 'en' },
    { text: 'Arabic', flag: 'assets/images/flags/tunisia.jpg', lang: 'ar' },
    { text: 'French', flag: 'assets/images/flags/french.jpg', lang: 'fr' },
  ];

  openMobileMenu: boolean;

  @Output() settingsButtonClicked = new EventEmitter();
  @Output() mobileMenuButtonClicked = new EventEmitter();

  ngOnInit() {
    this.openMobileMenu = false;
    this.unreadCount$ = combineLatest([
      this.notificationService.readIds$,
      this.notificationsSubject.asObservable()
    ]).pipe(
      map(([readIds, items]) => items.filter(n => !readIds.has(n.id)).length)
    );
    this.loadRecentNotifications();
    this.element = document.documentElement;

    this.cookieValue = this._cookiesService.get('lang');
    const val = this.listLang.filter(x => x.lang === this.cookieValue);
    this.countryName = val.map(element => element.text);
    if (val.length === 0) {
      if (this.flagvalue === undefined) { this.valueset = 'assets/images/flags/us.jpg'; }
    } else {
      this.flagvalue = val.map(element => element.flag);
    }
  }

  setLanguage(text: string, lang: string, flag: string) {
    this.countryName = text;
    this.flagvalue = flag;
    this.cookieValue = lang;
    this.languageService.setLanguage(lang);
  }

  /**
   * Toggles the right sidebar
   */
  toggleRightSidebar() {
    this.settingsButtonClicked.emit();
  }

  /**
   * Toggle the menu bar when having mobile screen
   */
  toggleMobileMenu(event: any) {
    event.preventDefault();
    this.mobileMenuButtonClicked.emit();
  }

  /** Load the 5 most recent ADMIN notifications (newest first). */
  loadRecentNotifications(): void {
    if (this.loadingNotifications) {
      return;
    }
    this.loadingNotifications = true;
    this.notificationService.getLatestByTarget('ADMIN', 0, 5).subscribe({
      next: (items) => {
        const list = Array.isArray(items) ? items : [];
        this.recentNotifications = list;
        this.notificationsSubject.next(list);
        this.listFresh = true;
        this.loadingNotifications = false;
      },
      error: () => {
        this.loadingNotifications = false;
      }
    });
  }

  /** Refresh the list when the bell dropdown opens (load-on-init + refresh-on-open, no polling). */
  onNotificationsOpen(open: boolean): void {
    if (open && !this.listFresh) {
      this.loadRecentNotifications();
    }
  }

  /** Mark one notification read — the item loses its unread styling via the reactive readIds$ stream. */
  onNotificationClick(n: NotificationDto): void {
    if (!this.notificationService.isRead(n.id)) {
      this.notificationService.markAsRead(n.id);
    }
  }

  /** Navigate to the full notifications page (route owned by another lane). */
  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  /** Sync helper for the template — is this notification still unread? */
  isNotificationUnread(n: NotificationDto): boolean {
    return !this.notificationService.isRead(n.id);
  }

  /** Avatar background class per notification severity (Skote palette). */
  notificationAvatarClass(n: NotificationDto): string {
    switch (n.type) {
      case 'ERROR': return 'bg-danger';
      case 'WARNING': return 'bg-warning';
      default: return 'bg-primary';
    }
  }

  /** Avatar icon per notification severity. */
  notificationAvatarIcon(n: NotificationDto): string {
    switch (n.type) {
      case 'ERROR': return 'bx bx-error-circle';
      case 'WARNING': return 'bx bx-error';
      default: return 'bx bx-bell';
    }
  }

  /** Human-friendly timestamp: relative ("5 min ago") under 24h, else short absolute date. */
  notificationTime(createdAt?: string): string {
    if (!createdAt) {
      return '';
    }
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) {
      return createdAt;
    }
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 0) {
      return date.toLocaleString();
    }
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) {
      return this.translate.instant('layout.topbar.justNow');
    }
    if (mins < 60) {
      return mins + (mins === 1 ? this.translate.instant('layout.topbar.minAgo') : this.translate.instant('layout.topbar.minsAgo'));
    }
    const hours = Math.floor(mins / 60);
    if (hours < 24) {
      return hours + (hours === 1 ? this.translate.instant('layout.topbar.hourAgo') : this.translate.instant('layout.topbar.hoursAgo'));
    }
    return date.toLocaleString();
  }

  /**
   * Logout the user
   */
  logout() {
    if (environment.defaultauth === 'firebase') {
      this.authService.logout();
    } else {
      this.authFackservice.logout();
    }
    this.router.navigate(['/account/login']);
  }

  /**
   * Fullscreen method
   */
  fullscreen() {
    document.body.classList.toggle('fullscreen-enable');
    if (
      !document.fullscreenElement && !this.element.mozFullScreenElement &&
      !this.element.webkitFullscreenElement) {
      if (this.element.requestFullscreen) {
        this.element.requestFullscreen();
      } else if (this.element.mozRequestFullScreen) {
        /* Firefox */
        this.element.mozRequestFullScreen();
      } else if (this.element.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        this.element.webkitRequestFullscreen();
      } else if (this.element.msRequestFullscreen) {
        /* IE/Edge */
        this.element.msRequestFullscreen();
      }
    } else {
      if (this.document.exitFullscreen) {
        this.document.exitFullscreen();
      } else if (this.document.mozCancelFullScreen) {
        /* Firefox */
        this.document.mozCancelFullScreen();
      } else if (this.document.webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        this.document.webkitExitFullscreen();
      } else if (this.document.msExitFullscreen) {
        /* IE/Edge */
        this.document.msExitFullscreen();
      }
    }
  }
}
