import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildTrigger,
  BaseBuildTriggerProps,
} from "./base_build_trigger.ts";

export interface VcsBuildTriggerProps extends BaseBuildTriggerProps {
  /**
   * If you have a build chain (that is a number of builds interconnected by
   * snapshot dependencies), the triggers are to be configured in the final
   * build in the chain.
   *
   * The VCS build trigger has another option that alters triggering behavior
   * for a build chain. With this options enabled, the whole build chain will
   * be triggered even if changes are detected in dependencies, not in the
   * final build.
   *
   * Defaults to `false`.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-vcs-triggers.html#ConfiguringVCSTriggers-Triggerabuildonchangesinsnapshotdependencies
   */
  watchChangesInDependencies?: boolean;

  /**
   * Trigger a build on each check-in.
   *
   * When this option is not enabled, several check-ins by different committers
   * can be made; and once they are detected, TeamCity will add only one build
   * to the queue with all of these changes.
   *
   * If you have fast builds and enough build agents, you can make TeamCity
   * launch a new build for each check-in ensuring that no other changes get
   * into the same build.
   *
   * Defaults to `false`.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-vcs-triggers.html#Per-check-in+Triggering
   */
  perCheckinTriggering?: boolean | {
    /**
     * Include several check-ins in a build if they are from the same committer.
     *
     * If enabled, TeamCity will detect a number of pending changes,
     * it will group them by user and start builds having single user
     * changes only.
     *
     * This helps to figure out whose change broke a build or caused a new test
     * failure, should such issue arise.
     *
     * Defaults to `false`.
     *
     * see: https://www.jetbrains.com/help/teamcity/configuring-vcs-triggers.html#Per-check-in+Triggering
     */
    groupCheckinsByCommitter: boolean;
  };

  /**
   * By specifying the quiet period you can ensure the build is not triggered
   * in the middle of non-atomic check-ins consisting of several VCS check-ins.
   *
   * A quiet period is a period (in seconds) that TeamCity maintains between
   * the moment the last VCS change is detected and a build is added into the
   * queue.
   *
   * If new VCS change is detected in the Build Configuration within the period,
   * the period starts over from the new change detection time. The build is
   * added into the queue only if there were no new VCS changes detected within
   * the quiet period.
   *
   * Note that the actual quiet period will not be less than the maximum checking
   * for changes interval among the VCS roots of a build configuration, as TeamCity
   * must ensure that changes were collected at least once during the quiet period.
   *
   * The quiet period can be set to the default value (60 seconds, can be changed
   * globally at the Administration | Global Settings page) or to a custom value
   * for a build configuration.
   *
   * > HINT: When a build is triggered by a trigger with the VCS quiet period set,
   * > the build is put into the queue with fixed VCS revisions. This ensures the
   * > build will be started with only the specific changes included. Under certain
   * > circumstances this build can later become a History Build.

   * Defaults to `DO_NOT_USE`.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-vcs-triggers.html#ConfiguringVCSTriggers-quietPeriod
   */
  quietPeriod?: "DO_NOT_USE" | "USE_DEFAULT" | number;

  /**
   * Queued build can be replaced with a more recent build.
   *
   * Defaults to `true`.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-vcs-triggers.html#Build+Queue+Optimization+Settings
   */
  enableQueueOptimization?: boolean;

  /**
   * If no trigger rules are specified, a build is triggered upon any change
   * detected for the build configuration. You can control what changes are
   * detected by changing the VCS root settings and specifying Checkout Rules.
   *
   * To limit the changes that trigger the build, use the VCS trigger rules.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-vcs-triggers.html#ConfiguringVCSTriggers-buildTriggerRules
   */
  triggerRules?: string[];

  /**
   * Limit the set of branches in which builds can be triggered by this VCS trigger.
   *
   * Trigger rules and branch filter are combined by **AND**, which means that
   * the build is triggered only when both conditions are satisfied.
   *
   * For example, if you specify a comment text in the trigger rules field and
   * provide the branch specification, the build will be triggered only if a
   * commit has the special text and is also in a branch matched by branch filter.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-vcs-triggers.html#branch-filter-1
   */
  branchFilter?: string[];
}

/**
 * VCS triggers automatically start a new build each time TeamCity detects
 * new changes in the configured VCS roots and displays the change in the
 * pending changes.
 *
 * Multiple VCS triggers can be added to a build configuration.
 *
 * see: https://www.jetbrains.com/help/teamcity/configuring-vcs-triggers.html
 */
export class VcsBuildTrigger extends BaseBuildTrigger<VcsBuildTriggerProps> {
  constructor(scope: Build, props: VcsBuildTriggerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("vcsTrigger", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", {
          name: "watchChangesInDependencies",
          value: (this.props.watchChangesInDependencies ?? false)
            ? "true"
            : "false",
        });

        if (
          typeof this.props.perCheckinTriggering !== "undefined" &&
          this.props.perCheckinTriggering !== false
        ) {
          x.Node("param", {
            name: "perCheckinTriggering",
            value: "true",
          });
          if (typeof this.props.perCheckinTriggering === "object") {
            x.Node("param", {
              name: "groupCheckinsByCommitter",
              value: this.props.perCheckinTriggering.groupCheckinsByCommitter
                ? "true"
                : "false",
            });
          }
        }

        let mode = (this.props.quietPeriod ?? "DO_NOT_USE") as string;
        if (typeof this.props.quietPeriod === "number") {
          mode = "USE_CUSTOM";
          x.Node("param", {
            name: "quietPeriod",
            value: this.props.quietPeriod.toString(),
          });
        }
        x.Node("param", { name: "quietPeriodMode", value: mode });

        x.Node("param", {
          name: "enableQueueOptimization",
          value: (this.props.enableQueueOptimization ?? true)
            ? "true"
            : "false",
        });

        if (
          Array.isArray(this.props.triggerRules) &&
          this.props.triggerRules.length > 0
        ) {
          x.Node(
            "param",
            { name: "triggerRules" },
            (x) => x.CDATA(this.props.triggerRules!.join("\n")),
          );
        }

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
     * Adds a new VcsBuildTrigger to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.VcsTrigger({ ... });
     *  });
     * });
     * ```
     */
    VcsTrigger(
      props: VcsBuildTriggerProps,
    ): VcsBuildTrigger;
  }
}

Build.prototype.VcsTrigger = function (
  this: Build,
  props: VcsBuildTriggerProps,
) {
  return new VcsBuildTrigger(this, props);
};
