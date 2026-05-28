import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { map } from 'rxjs/internal/operators/map';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly isMobile$ = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map((result) => result.matches));

  readonly isMobileView = toSignal(this.isMobile$);

  readonly sizing = {
    header: 70,
    innerPadding: 32,
    innerContentHeight: function () {
      return `calc(100dvh - ${this.header + this.innerPadding * 2}px)`;
    },
  } as const;
}
