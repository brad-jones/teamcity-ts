import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildTrigger,
  BaseBuildTriggerProps,
} from "./base_build_trigger.ts";

export interface MavenSnapshotBuildTriggerProps extends BaseBuildTriggerProps {
  /**
   * Select this option to trigger a build only after the build that produces
   * artifacts used here is finished.
   *
   * Defaults to `false`.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-maven-triggers.html#Maven+Artifact+Dependency+Trigger
   */
  skipIfRunning?: boolean;
}

/**
 * Maven snapshot dependency trigger adds a new build to the queue when there
 * is a real modification of the snapshot dependency content in the remote
 * repository which is detected by the checksum change.
 *
 * Dependency artifacts are resolved according to the POM and the server-side
 * Maven Settings.
 *
 * Since Maven deploys artifacts to remote repositories sequentially during a
 * build, not all artifacts may be up-to-date at the moment the snapshot
 * dependency trigger detects the first updated artifact.
 *
 * To avoid inconsistency, select the Do not trigger a build if currently
 * running builds can produce snapshot dependencies check box when adding
 * this trigger, which will ensure the build won't start while builds producing
 * snapshot dependencies are still running.
 *
 * Simultaneous usage of snapshot dependency and dependency trigger for a build
 * Assume build A depends on build B by both snapshot and trigger dependency.
 * Then, after the build B finishes, build A will be added into the queue,
 * only if build B is not a part of the build chain containing A.
 *
 * see: https://www.jetbrains.com/help/teamcity/configuring-maven-triggers.html#Maven+Snapshot+Dependency+Trigger
 */
export class MavenSnapshotBuildTrigger
  extends BaseBuildTrigger<MavenSnapshotBuildTriggerProps> {
  constructor(scope: Build, props: MavenSnapshotBuildTriggerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("mavenSnapshotDependencyTrigger", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", {
          name: "skipIfRunning",
          value: (this.props.skipIfRunning ?? false) ? "true" : "false",
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new MavenSnapshotBuildTrigger to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.MavenSnapshotTrigger({ ... });
     *  });
     * });
     * ```
     */
    MavenSnapshotTrigger(
      props: MavenSnapshotBuildTriggerProps,
    ): MavenSnapshotBuildTrigger;
  }
}

Build.prototype.MavenSnapshotTrigger = function (
  this: Build,
  props: MavenSnapshotBuildTriggerProps,
) {
  return new MavenSnapshotBuildTrigger(this, props);
};
