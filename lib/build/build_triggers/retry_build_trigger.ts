import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildTrigger,
  BaseBuildTriggerProps,
} from "./base_build_trigger.ts";

export interface RetryBuildTriggerProps extends BaseBuildTriggerProps {
  /**
   * Specify seconds to wait before adding a new build to the queue.
   */
  enqueueTimeout: number;

  /**
   * Specify how many times the trigger will try to rerun the failing build.
   *
   * > HINT: Leave undefined for unlimited number of retry attempts.
   */
  retryAttempts?: number;

  /**
   * With this option enabled, the retry trigger will rerun a failed build
   * using the same source revisions.
   *
   * This option helps identify build problems that do not depend on the build
   * code: for example, if there are flaky tests in the build configuration or
   * if there was some unforeseen agent compatibility issue.
   *
   * If the build with the trigger is a part of a build chain, all the successful
   * builds from the previous chain run will be reused and all the failed dependency
   * builds, that could have contributed to the failure of the dependent build,
   * will be rebuilt on the same revision.
   *
   * If any build parameters or comments are specified in the custom build settings,
   * they will be applied to the following build runs initiated by the retry trigger.
   *
   * Defaults to `true`.
   */
  useSameRevisions?: boolean;

  /**
   * With this option enabled, retried builds will always be put to the queue top.
   *
   * Defaults to `false`.
   */
  moveToTheQueueTop?: boolean;

  /**
   * Apply a branch filter to rerun failed builds only in branches that match
   * the specified criteria.
   *
   * Defaults to `+:*`.
   */
  branchFilter?: string[];
}

/**
 * The retry build trigger automatically adds a new build to the queue if the
 * previous build of the current build configuration has failed.
 *
 * see: https://www.jetbrains.com/help/teamcity/configuring-retry-build-trigger.html
 */
export class RetryBuildTrigger
  extends BaseBuildTrigger<RetryBuildTriggerProps> {
  constructor(scope: Build, props: RetryBuildTriggerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("retryBuildTrigger", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", {
          name: "enqueueTimeout",
          value: this.props.enqueueTimeout.toString(),
        });

        if (typeof this.props.retryAttempts !== "undefined") {
          x.Node("param", {
            name: "retryAttempts",
            value: this.props.retryAttempts.toString(),
          });
        }

        x.Node("param", {
          name: "reRunBuildWithTheSameRevisions",
          value: (this.props.useSameRevisions ?? true) ? "true" : "false",
        });

        x.Node("param", {
          name: "moveToTheQueueTop",
          value: (this.props.moveToTheQueueTop ?? false) ? "true" : "false",
        });

        x.Node(
          "param",
          { name: "branchFilter" },
          (x) => x.CDATA((this.props.branchFilter ?? ["+:*"]).join("\n")),
        );
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new RetryBuildTrigger to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.RetryTrigger({ ... });
     *  });
     * });
     * ```
     */
    RetryTrigger(
      props: RetryBuildTriggerProps,
    ): RetryBuildTrigger;
  }
}

Build.prototype.RetryTrigger = function (
  this: Build,
  props: RetryBuildTriggerProps,
) {
  return new RetryBuildTrigger(this, props);
};
