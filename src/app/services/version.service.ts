import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from "@angular/common/http";

import { shareReplay, map, tap, switchMap, catchError, startWith } from "rxjs/operators";
import { Observable, Subject, BehaviorSubject, ReplaySubject, empty } from 'rxjs';

export interface Version {
  id: string,
  type: 'snapshot' | 'release' | 'old_beta' | 'old_alpha',
  url: string,
  time: string,
  releaseTime: string
}

interface VersionManifest {
  latest?: {
    release: string,
    snapshot: string
  },
  versions?: Version[]
}

const versionManifestUrl = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';

export enum FetchingStatus {
  Unloaded, Loading, Loaded, Errored
}

@Injectable({
  providedIn: 'root'
})
export class VersionService {
  constructor(
    private http: HttpClient
  ) { }

  // TODO: split loading logic into separate service/class for loading a generic request that can be refreshed
  private readonly versionManifestRefreshSubject = new Subject<void>();
  readonly versionManifestStatus = new BehaviorSubject<FetchingStatus>(FetchingStatus.Unloaded);
  readonly versionManifestError = new ReplaySubject<HttpErrorResponse>();
  readonly versionManifest: Observable<VersionManifest> = this.versionManifestRefreshSubject.pipe(
    startWith(""),
    tap(() => this.versionManifestStatus.next(FetchingStatus.Loading)),
    switchMap(() => this.fetchVersionManifest()),
    tap(() => this.versionManifestStatus.next(FetchingStatus.Loaded)),
    shareReplay(1)
  );

  refreshVersions() {
    this.versionManifestRefreshSubject.next();
  }

  private fetchVersionManifest() {
    return this.http.get<VersionManifest>(versionManifestUrl, { observe: 'body', responseType: 'json' }).pipe(
      catchError(e => {
        this.versionManifestError.next(e);
        this.versionManifestStatus.next(FetchingStatus.Errored);
        return empty();
      })
    )
  }
  
  // TODO: Allow choosing the selected version, defaulting to the most recent release
  // TODO: Add ability to load more data about each version lazily
}
