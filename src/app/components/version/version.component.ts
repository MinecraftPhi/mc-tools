import { Component, OnInit } from '@angular/core';

import { VersionService, FetchingStatus } from 'src/app/services/version/version.service';

import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

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
  
  ngOnInit(): void {
    this.isLoading = this.versionService.versionManifestStatus.pipe(
      map(s => s == FetchingStatus.Unloaded || s == FetchingStatus.Loading)
    );
    this.versions = this.versionService.versionManifest.pipe(
      map(m => m.versions.map(v => v.id))
    );
  }

}
