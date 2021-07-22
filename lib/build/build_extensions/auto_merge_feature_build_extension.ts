import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface AutoMergeFeatureBuildExtensionProps
  extends BaseBuildExtensionProps {
  /**
   * Specify the branches whose builds' sources will be merged.
   *
   * see: https://www.jetbrains.com/help/teamcity/branch-filter.html
   */
  srcBranchFilter: string[];

  /**
   * A logical name of the destination branch the sources will be merged to.
   *
   * The branch must be present in a repository and included into the
   * Branch Specification.
   *
   * > HINT: Parameter references are supported here.
   */
  dstBranch: string;

  /**
   * A message for a merge commit.
   *
   * Defaults to `Merge branch '%teamcity.build.branch%'`.
   *
   * > HINT: Parameter references are supported here.
   */
  commitMsg?: string;

  /**
   * A condition defining when the merge will be performed (either for successful
   * builds only, or if build from the branch does not add new problems to
   * destination branch).
   *
   * Defaults to `successful`.
   */
  mergeIf?: "successful" | "noNewTests";

  /**
   * Select to create a merge commit or do a fast-forward merge.
   *
   * Defaults to `alwaysCreateMergeCommit`.
   */
  mergePolicy?: "alwaysCreateMergeCommit" | "fastForward";

  /**
   * Choose when to merge:
   *
   * - Merge after build finish: the build finishes, and then the merge starts.
   *   The build duration does not include the merging time. Dependent builds
   *   can start even if merging is still in process.
   *
   * - Merge before build finish: the build is considered finished only when the
   *   merge is completed. Dependent builds will start only after the merge is
   *   completed.
   *
   * Defaults to `runAfterBuildFinish`.
   */
  runPolicy?: "runAfterBuildFinish" | "runBeforeBuildFinish";
}

/**
 * The Automatic Merge build feature tracks builds in branches matched by the
 * configured filter and merges them into a specified destination branch if
 * the build satisfies the condition configured (for example, the build is
 * successful).
 *
 * The feature is supported for Git and Mercurial VCS roots for build
 * configurations with enabled feature branches.
 *
 * see: https://www.jetbrains.com/help/teamcity/automatic-merge.html
 */
export class AutoMergeFeatureBuildExtension
  extends BaseBuildExtension<AutoMergeFeatureBuildExtensionProps> {
  constructor(scope: Build, props: AutoMergeFeatureBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("AutoMergeFeature", (x) => {
      x.Node("parameters", (x) => {
        x.Node(
          "param",
          { name: "teamcity.automerge.srcBranchFilter" },
          (x) => x.CDATA(this.props.srcBranchFilter.join("\n")),
        );

        x.Node("param", {
          name: "teamcity.automerge.dstBranch",
          value: this.props.dstBranch,
        });

        x.Node("param", {
          name: "teamcity.automerge.message",
          value: this.props.commitMsg ??
            "Merge branch '%teamcity.build.branch%'",
        });

        x.Node("param", {
          name: "teamcity.automerge.buildStatusCondition",
          value: this.props.mergeIf ?? "successful",
        });

        x.Node("param", {
          name: "teamcity.merge.policy",
          value: this.props.mergePolicy ?? "alwaysCreateMergeCommit",
        });

        x.Node("param", {
          name: "teamcity.automerge.run.policy",
          value: this.props.runPolicy ?? "runAfterBuildFinish",
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new AutoMergeFeatureBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.AutoMergeFeatureExtension({ ... });
     *  });
     * });
     * ```
     */
    AutoMergeFeatureExtension(
      props: AutoMergeFeatureBuildExtensionProps,
    ): AutoMergeFeatureBuildExtension;
  }
}

Build.prototype.AutoMergeFeatureExtension = function (
  this: Build,
  props: AutoMergeFeatureBuildExtensionProps,
) {
  return new AutoMergeFeatureBuildExtension(this, props);
};
