import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { Subject, BehaviorSubject, ReplaySubject, empty } from 'rxjs';
import { startWith, tap, switchMap, shareReplay, catchError, withLatestFrom, filter, debounceTime } from 'rxjs/operators';

export enum ResourceStatus {
  Unloaded = 'Unloaded',
  Loading = 'Loading',
  Loaded = 'Loaded',
  Errored = 'Errored'
}

export class RefreshableResource<T> {
  constructor (
    private url: string,
    private http: HttpClient
  ) {}
  
  private readonly refresh$ = new Subject<void>();
  private readonly statusSubject$ = new BehaviorSubject<ResourceStatus>(ResourceStatus.Unloaded);
  private readonly errorSubject$ = new BehaviorSubject<HttpErrorResponse>(null);

  readonly data$ = this.refresh$.pipe(                            // On each refresh
    startWith(""),                                                // Load on first subscription without waiting for a refresh
    debounceTime(500),                                            // Avoid rapid requests
    withLatestFrom(this.statusSubject$),                          // Check current status:
    filter(([_, s]) => s != ResourceStatus.Loading),              //    To prevent sending multiple requests simultaneously
    tap(() => this.statusSubject$.next(ResourceStatus.Loading)),  // Notify that the data is loading
    switchMap(() => this.fetch()),                                // Actually fetch the data
    tap(() => {                                                   // When data is received successfully:
      this.errorSubject$.next(null);                              //    Clear any existing errors
      this.statusSubject$.next(ResourceStatus.Loaded);            //    Notify that the data was loaded succesfully
    }),
    shareReplay(1)                                                // Share a single response among all subscribers
  );

  get status$() {
    return this.statusSubject$.asObservable();
  }

  get error$() {
    return this.errorSubject$.asObservable();
  }

  refresh() {
    this.refresh$.next();
  }

  private fetch() {
    return this.http.get<T>(this.url, { observe: 'body', responseType: 'json' }).pipe(
      catchError(e => {
        this.errorSubject$.next(e);
        this.statusSubject$.next(ResourceStatus.Errored);
        return empty();
      })
    );
  }
}

export abstract class RefreshableResourceService<T> {
  constructor(
    private http: HttpClient
  ) { }

  private readonly cache: Record<string, RefreshableResource<T>> = {};

  getResource(url: string)
  {
    if(!(url in this.cache))
    {
      this.cache[url] = new RefreshableResource<T>(url, this.http);
    }
    return this.cache[url];
  }
}
