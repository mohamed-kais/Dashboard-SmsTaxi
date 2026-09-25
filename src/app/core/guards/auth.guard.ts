import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthenticationService } from '../services/auth.service';
import { AuthfakeauthenticationService } from '../services/authfake.service';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthGuard  {
    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
        private authFackservice: AuthfakeauthenticationService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (environment.defaultauth === 'firebase') {
            const currentUser = this.authenticationService.currentUser();
            if (currentUser) {
                // logged in so return true
                return true;
            }
        } else {
            const currentUser = this.authFackservice.currentUserValue;
            if (currentUser) {
                // logged in so return true
                return true;
            }
        }
        // not logged in so redirect to login page with the return url
        // (/account/login 404s — the real login route is /account/auth/login;
        // see docs/TEMPLATE_GUIDE.md §7 ambiguity #2)
        this.router.navigate(['/account/auth/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }
}
