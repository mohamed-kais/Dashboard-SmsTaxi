import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LayoutComponent } from './layout.component';

import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { LanguageService } from '../core/services/language.service';
import { EventService } from '../core/services/event.service';
import { LoaderService } from '../core/services/loader.service';
import { AuthenticationService } from '../core/services/auth.service';
import { AuthfakeauthenticationService } from '../core/services/authfake.service';
import { UserProfileService } from '../core/services/user.service';
import { NotificationService } from '../core/services/notification.service';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [LayoutComponent],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideTranslateService(),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {}, paramMap: { get: () => null } }, fragment: of(null) } },
      CookieService,
      LanguageService,
      EventService,
      LoaderService,
      AuthenticationService,
      AuthfakeauthenticationService,
      UserProfileService,
      {
        provide: NotificationService,
        useValue: {
          readIds$: of(new Set<number>()),
          getLatestByTarget: () => of([]),
          isRead: () => false,
          markAsRead: () => undefined
        }
      }
    ]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
