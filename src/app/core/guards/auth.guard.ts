import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthenticationService } from '../services/auth.service';
import { AuthfakeauthenticationService } from '../services/authfake.service';

import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const authenticationService = inject(AuthenticationService);
    const authFackservice = inject(AuthfakeauthenticationService);

    if (environment.defaultauth === 'firebase') {
        const currentUser = authenticationService.currentUser();
        if (currentUser) {
            // logged in so return true
            return true;
        }
    } else {
        const currentUser = authFackservice.currentUserValue;
        if (currentUser) {
            // logged in so return true
            return true;
        }
    }
    // not logged in so redirect to login page with the return url
    // (/account/login 404s — the real login route is /account/auth/login;
    // see docs/TEMPLATE_GUIDE.md §7 ambiguity #2)
    router.navigate(['/account/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
};
