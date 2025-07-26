import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { TokenService } from '../services/token.service';
import { isPlatformServer } from '@angular/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/**
 * Interceptor function to add JWT to requests.
 *
 * This function intercepts outgoing HTTP requests and adds an Authorization header
 * with a bearer token if one is available. It's designed to work with Angular's
 * functional interceptor pattern. It will automatically add the 'Authorization' header
 * to all HTTP requests. It also handles Server-Side Rendering (SSR) by checking
 * the platform and skipping auth logic in a server context.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const platformId = inject(PLATFORM_ID);
  const tokenService = inject(TokenService);

  // Skip interception for server-side rendering
  if (isPlatformServer(platformId)) {
    return next(req);
  }

  // Exclude auth endpoints from interception
  if (
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh')
  ) {
    return next(req);
  }

  // Convert token retrieval to an Observable stream
  return from(Promise.resolve(tokenService.getToken())).pipe(
    switchMap((token: string | null) => {
      if (!token) {
        // If no token, proceed with the original request
        return next(req);
      }

      // If a token exists, clone the request to add the new header
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });

      // Pass the cloned request to the next handler
      return next(authReq);
    })
  );
};
