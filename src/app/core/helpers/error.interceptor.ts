import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthenticationService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
    const authenticationService = inject(AuthenticationService);

    return next(request).pipe(catchError(err => {
        if (err.status === 401) {
            // auto logout if 401 response returned from api
            authenticationService.logout();
            location.reload();
        }

        const error = err.error.message || err.statusText;
        return throwError(error);
    }));
};
