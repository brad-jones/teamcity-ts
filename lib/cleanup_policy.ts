export type CleanupPolicy =
  | CleanupPolicyEverything
  | CleanupPolicyArtifacts
  | CleanupPolicyHistory;

export interface CleanupPolicyBase {
  /**
   * Anything older than X days since the last build will be deleted.
   *
   * > HINT: This can be combined with `keepBuilds` but at least one
   * >       of these options must be defined.
   */
  keepDays?: number;

  /**
   * Only X number of successfully completed builds will be kept.
   */
  keepBuilds?: number;
}

export interface CleanupPolicyEverything extends CleanupPolicyBase {
  /**
   * Clean everything including artifacts, history, and statistical data.
   */
  cleanupLevel: "EVERYTHING";
}

export interface CleanupPolicyHistory extends CleanupPolicyBase {
  /**
   * Clean history and statistical data.
   */
  cleanupLevel: "HISTORY_ENTRY";
}

export interface CleanupPolicyArtifacts extends CleanupPolicyBase {
  /**
   * Clean published artifacts.
   */
  cleanupLevel: "ARTIFACTS";

  /**
   * An optional list of artifact patterns to match against.
   * In the form of `+:/-:` Ant-style pattern wildcard.
   *
   * > HINT: If left undefined any artifact that matches the `keepDays` /
   * >       `keepBuilds` properties will be deleted.
   */
  patterns?: string[];
}
