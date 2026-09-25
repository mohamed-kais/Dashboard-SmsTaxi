import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Lockscreen2Component } from './lockscreen2.component';

import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { LanguageService } from '../../core/services/language.service';
import { EventService } from '../../core/services/event.service';
import { LoaderService } from '../../core/services/loader.service';
import { AuthenticationService } from '../../core/services/auth.service';
import { AuthfakeauthenticationService } from '../../core/services/authfake.service';
import { UserProfileService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';

describe('Lockscreen2Component', () => {
  let component: Lockscreen2Component;
  let fixture: ComponentFixture<Lockscreen2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [Lockscreen2Component],
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
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Lockscreen2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
