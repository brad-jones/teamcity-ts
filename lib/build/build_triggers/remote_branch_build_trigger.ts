import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildTrigger,
  BaseBuildTriggerProps,
} from "./base_build_trigger.ts";

export interface RemoteBranchBuildTriggerProps extends BaseBuildTriggerProps {
  /**
   * Pattern of Branches to Monitor.
   *
   * For git:
   * - Defaults to `refs/heads/remote-run/*`.
   *
   * For mercurial :
   * - Defaults to `remote-run/*`.
   */
  pattern?: string;
}

/**
 * The branch remote run trigger automatically starts a new personal build
 * each time TeamCity detects changes in particular branches of the VCS roots
 * of the build configuration.
 *
 * Finished personal builds are listed in the build history, but only for the
 * users who initiated them.
 *
 * > HINT: At the moment, the branch remote run trigger supports only Git
 * >       and Mercurial VCSs.
 *
 * see: https://www.jetbrains.com/help/teamcity/branch-remote-run-trigger.html
 */
export class RemoteBranchBuildTrigger
  extends BaseBuildTrigger<RemoteBranchBuildTriggerProps> {
  constructor(scope: Build, props: RemoteBranchBuildTriggerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("remoteRunOnBranch", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", {
          name: "branchy:jetbrains.git",
          value: "pattern:jetbrains.git",
        });

        x.Node("param", {
          name: "pattern:jetbrains.git",
          value: this.props.pattern ?? "refs/heads/remote-run/*",
        });

        // TODO: mercurial
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new RemoteBranchBuildTrigger to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.RemoteBranchTrigger({ ... });
     *  });
     * });
     * ```
     */
    RemoteBranchTrigger(
      props: RemoteBranchBuildTriggerProps,
    ): RemoteBranchBuildTrigger;
  }
}

Build.prototype.RemoteBranchTrigger = function (
  this: Build,
  props: RemoteBranchBuildTriggerProps,
) {
  return new RemoteBranchBuildTrigger(this, props);
};
