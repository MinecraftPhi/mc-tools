import { Component, OnInit } from '@angular/core';

import { VersionService, VersionType } from 'src/app/services/version/version.service';

import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { ResourceStatus } from 'src/app/services/refreshable-resource/refreshable-resource.service';
import { combineLatestRecursive } from 'src/app/utilities/observable';

@Component({
  selector: 'version-selector',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.scss']
})
export class VersionComponent implements OnInit {
  constructor(
    public versionService: VersionService
  ) { }

  selectedVersion: string;
  isLoading: Observable<boolean>;
  versions: Observable<string[]>;
  includeSnapshots$ = new BehaviorSubject(false);
  includeBeta$ = new BehaviorSubject(false);
  includeAlpha$ = new BehaviorSubject(false);
  
  ngOnInit(): void {
    const versionManifest = this.versionService.versionManifest;
    this.isLoading = versionManifest.status$.pipe(
      map(s => s == ResourceStatus.Unloaded || s == ResourceStatus.Loading)
    );

    this.versions = combineLatestRecursive({
      manifest: versionManifest.data$,
      include: {
        [VersionType.release]: true,
        [VersionType.snapshot]: this.includeSnapshots$,
        [VersionType.old_beta]: this.includeBeta$,
        [VersionType.old_alpha]: this.includeAlpha$
      }
    }).pipe(
      map(l => l.manifest.versions
        .filter(v => l.include[v.type])
        .map(v => v.id)
      )
    )
  }

}
