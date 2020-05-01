import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";

import { RefreshableResource } from '../refreshable-resource/refreshable-resource.service';

export interface Version {
  id: string,
  type: 'snapshot' | 'release' | 'old_beta' | 'old_alpha',
  url: string,
  time: string,
  releaseTime: string
}

interface VersionManifest {
  latest: {
    release: string,
    snapshot: string
  },
  versions: Version[]
}

const versionManifestUrl = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';

@Injectable({
  providedIn: 'root'
})
export class VersionService {
  constructor(
    private http: HttpClient
  ) {
    this.versionManifest = new RefreshableResource<VersionManifest>(versionManifestUrl, http);
  }

  readonly versionManifest: RefreshableResource<VersionManifest>;
  
  // TODO: Allow choosing the selected version, defaulting to the most recent release
  // TODO: Add ability to load more data about each version lazily
}
