import { Component, OnInit } from '@angular/core';

import { VersionService } from 'src/app/services/version/version.service';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ResourceStatus } from 'src/app/services/refreshable-resource/refreshable-resource.service';

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
    const versionManifest = this.versionService.versionManifest;
    this.isLoading = versionManifest.status$.pipe(
      map(s => s == ResourceStatus.Unloaded || s == ResourceStatus.Loading)
    );
    this.versions = versionManifest.data$.pipe(
      map(m => m.versions.map(v => v.id))
    );
  }

}
