import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildTrigger,
  BaseBuildTriggerProps,
} from "./base_build_trigger.ts";

export interface CronBuildTriggerProps extends BaseBuildTriggerProps {
  /**
   * You can specify advanced time settings using cron -like expressions.
   * This format provides more flexible scheduling options.
   *
   * TeamCity uses Quartz for working with cron expressions.
   * See these examples or consider using the CronMaker utility
   * to generate expressions based on the Quartz cron format.
   *
   * see: https://www.jetbrains.com/help/teamcity/cron-expressions-in-teamcity.html#Examples
   * also: https://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/tutorial-lesson-06.html
   * also: http://www.cronmaker.com
   */
  cronExpression: {
    second: string;
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
    year?: string;
  };

  /**
   * A valid IANA time zone database "name".
   *
   * eg: `Australia/Melbourne`
   *
   * Defaults to `Etc/UTC`.
   *
   * see: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
   */
  timezone?: string;

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
   * Trigger only if the watched build changes.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-schedule-triggers.html#ConfiguringScheduleTriggers-BuildChanges
   */
  watchBuild?: {
    /**
     * The ID of the BuildType to watch for changes.
     */
    buildTypeId: string;

    /**
     * Promote the watched build if there is a dependency (snapshot or artifact)
     * on its build configuration.
     *
     * Defaults to `true`.
     */
    promoteBuild?: boolean;

    /**
     * You can select which build to watch:
     * - Last finished build
     * - Last successful build
     * - Last pinned build
     * - Last finished build with a specified build tag.
     */
    for: "lastFinished" | "lastSuccessful" | "lastPinned" | "buildTag";

    /**
     * The tag to watch for.
     *
     * > HINT: If `for=buildTag` this must be set to a value.
     */
    tag?: string;
  };

  /**
   * Delete all files in the checkout directory before the build.
   *
   * Defaults to `false`.
   */
  enforceCleanCheckout?: boolean | {
    /**
     * Also apply to all snapshot dependencies?
     */
    forDependencies: boolean;
  };

  /**
   * Trigger only if there are pending changes.
   *
   * Defaults to `false`.
   */
  triggerBuildWithPendingChangesOnly?: boolean;

  /**
   * Trigger build on all enabled and compatible agents.
   *
   * Defaults to `false`.
   */
  triggerBuildOnAllCompatibleAgents?: boolean;

  /**
   * Queued build can be replaced with an already started build
   * or a more recent queued build.
   *
   * Defaults to `true`.
   */
  enableQueueOptimization?: boolean;

  /**
   * By default, a schedule trigger works for all branches.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-schedule-triggers.html#Branch+Filter
   */
  branchFilter?: string[];
}

/**
 * The schedule trigger allows you to set the time when a build of the
 * configuration will be run. Multiple schedule triggers can be added to
 * a build configuration.
 *
 * see: https://www.jetbrains.com/help/teamcity/configuring-schedule-triggers.html
 */
export class CronBuildTrigger extends BaseBuildTrigger<CronBuildTriggerProps> {
  constructor(scope: Build, props: CronBuildTriggerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("schedulingTrigger", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", { name: "schedulingPolicy", value: "cron" });
        x.Node("param", {
          name: "timezone",
          value: this.props.timezone ?? "Etc/UTC",
        });

        x.Node("param", {
          name: "cronExpression_dm",
          value: this.props.cronExpression.dayOfMonth,
        });
        x.Node("param", {
          name: "cronExpression_dw",
          value: this.props.cronExpression.dayOfWeek,
        });
        x.Node("param", {
          name: "cronExpression_hour",
          value: this.props.cronExpression.hour,
        });
        x.Node("param", {
          name: "cronExpression_min",
          value: this.props.cronExpression.minute,
        });
        x.Node("param", {
          name: "cronExpression_month",
          value: this.props.cronExpression.month,
        });
        x.Node("param", {
          name: "cronExpression_sec",
          value: this.props.cronExpression.second,
        });
        x.Node("param", {
          name: "cronExpression_year",
          value: this.props.cronExpression.year ?? "*",
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

        if (
          Array.isArray(this.props.branchFilter) &&
          this.props.branchFilter.length > 0
        ) {
          x.Node(
            "param",
            { name: "branchFilter" },
            (x) => x.CDATA(this.props.branchFilter!.join("\n")),
          );
        }

        x.Node("param", {
          name: "triggerBuildWithPendingChangesOnly",
          value: (this.props.triggerBuildWithPendingChangesOnly ?? false)
            ? "true"
            : "false",
        });

        x.Node("param", {
          name: "triggerBuildOnAllCompatibleAgents",
          value: (this.props.triggerBuildOnAllCompatibleAgents ?? false)
            ? "true"
            : "false",
        });

        x.Node("param", {
          name: "enableQueueOptimization",
          value: (this.props.enableQueueOptimization ?? true)
            ? "true"
            : "false",
        });

        if (
          typeof this.props.enforceCleanCheckout !== "undefined" &&
          this.props.enforceCleanCheckout !== false
        ) {
          x.Node("param", {
            name: "enforceCleanCheckout",
            value: "true",
          });
          if (typeof this.props.enforceCleanCheckout === "object") {
            x.Node("param", {
              name: "enforceCleanCheckoutForDependencies",
              value: this.props.enforceCleanCheckout.forDependencies
                ? "true"
                : "false",
            });
          }
        }

        if (typeof this.props.watchBuild !== "undefined") {
          x.Node("param", {
            name: "revisionRuleDependsOn",
            value: this.props.watchBuild.buildTypeId,
          });

          x.Node("param", {
            name: "revisionRule",
            value: this.props.watchBuild.for,
          });

          if (this.props.watchBuild.for === "buildTag") {
            if (typeof this.props.watchBuild.tag === "undefined") {
              throw new Error(
                "watchBuild.for=buildTag so you must supply a watchBuild.tag value",
              );
            }
            x.Node("param", {
              name: "revistionRuleBuildTag",
              value: this.props.watchBuild.tag,
            });
          }

          // TODO: seem to missing a schema value for "revisionRuleBuildBranch"
          // It's possibly we decided not to support that value for some specific
          // reason I just can't remember why...

          x.Node("param", {
            name: "promoteWatchedBuild",
            value: (this.props.watchBuild.promoteBuild ?? true)
              ? "true"
              : "false",
          });
        }
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new CronBuildTrigger to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.CronTrigger({ ... });
     *  });
     * });
     * ```
     */
    CronTrigger(props: CronBuildTriggerProps): CronBuildTrigger;
  }
}

Build.prototype.CronTrigger = function (
  this: Build,
  props: CronBuildTriggerProps,
) {
  return new CronBuildTrigger(this, props);
};
