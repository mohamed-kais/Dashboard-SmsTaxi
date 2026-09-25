import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { AuthenticationService } from '../services/auth.service';
import { AuthfakeauthenticationService } from '../services/authfake.service';

import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
    const authenticationService = inject(AuthenticationService);
    const authfackservice = inject(AuthfakeauthenticationService);

    if (environment.defaultauth === 'firebase') {
        const currentUser = authenticationService.currentUser();
        if (currentUser && currentUser.token) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${currentUser.token}`
                }
            });
        }
    } else {
        // add authorization header with jwt token if available
        const currentUser = authfackservice.currentUserValue;
        if (currentUser && currentUser.token) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${currentUser.token}`
                }
            });
        }
    }
    return next(request);
};
