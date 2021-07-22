import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface KeepRulesBuildExtensionProps extends BaseBuildExtensionProps {
  /**
   * Defines what build data to preserve. Provide one or more of these options.
   * Supplying the `everything` option is the same as supplying all the options.
   */
  readonly keep: ("everything" | "artifacts" | "logs" | "statistics")[];

  /**
   * Is the rule enabled or not?
   *
   * Default to: `true`.
   */
  enabled?: boolean;

  /**
   * If keeping artifacts, which artifacts should we keep.
   *
   * > HINT: If none is provided all artifacts are kept.
   */
  artifactPatterns?: string[];

  /**
   * To keep artifacts in dependencies or not. This option controls if the
   * builds of the dependency build configurations are also cleaned up.
   *
   * With this option enabled, if some build is preserved by this rule, all
   * artifacts of its dependency builds will also be preserved.
   *
   * The option works similarly to the Dependencies option of a base rule.
   *
   * Defaults to `true`.
   */
  keepDependantArtifacts?: boolean;

  /**
   * Defines which builds this cleanup rule applies to.
   */
  filter?: {
    /**
     * Whether to include failed builds or not.
     *
     * Defaults to `successful`.
     */
    status?: "any" | "successful" | "failed";

    /**
     * Whether to include personal builds or not.
     *
     * A personal build is a build-out of the common build sequence which
     * typically uses the changes not yet committed into the version control.
     *
     * Personal builds are usually initiated from one of the supported IDEs
     * via the Remote Run procedure. You can also upload a patch with changes
     * directly to the server...
     *
     * > HINT: If left undefined then both personal builds &
     * >       non personal builds will be matched by this filter.
     *
     * see: https://www.jetbrains.com/help/teamcity/personal-build.html
     */
    personal?: boolean;

    /**
     * Matches builds with any specified tag.
     */
    tags?: string[];

    /**
     * A list of branch patterns to match against.
     *
     * Defaults to `+:*`.
     */
    branches?: string[];

    /**
     * Matches only Active Branches.
     *
     * If left undefined then both active & inactive builds will be matched.
     *
     * > HINT: Yes this can be applied with custom branch patterns too.
     *
     * see: https://www.jetbrains.com/help/teamcity/working-with-feature-branches.html#Active+branches
     */
    onlyActiveBranches?: boolean;

    /**
     * The filter can be applied per every matching branch, or to all builds in
     * matching branches as one set. This affects how many builds are preserved:
     * e.g. 30 last builds in each branch or 30 last builds among all branches.
     *
     * Defaults to `true`;
     */
    perBranch?: boolean;
  };

  /**
   * Defines a quantity or time range for matching builds to be preserved.
   *
   * > HINT: If left undefined then all matching builds will be preserved.
   */
  range?: {
    type:
      | "lastNDays"
      | "lastNBuilds"
      | "NDaysSinceLastBuild"
      | "NDaysSinceLastSuccessfulBuild";
    n: number;
  };
}

/**
 * The clean-up rules define how to clean data in the current build.
 *
 * Keep rules define what data to preserve during the clean-up. They are very
 * flexible but take more effort to configure than base rules. Multiple keep
 * rules can be assigned to a Build or build configuration. Read how to
 * configure a keep rule.
 *
 * see: https://www.jetbrains.com/help/teamcity/2020.2/clean-up.html#Clean-up+Rules
 */
export class KeepRulesBuildExtension
  extends BaseBuildExtension<KeepRulesBuildExtensionProps> {
  constructor(scope: Build, props: KeepRulesBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return new XmlElement(
      "extension",
      { id: this.props.id, type: "keepRules" },
      (x) => {
        x.Node("parameters", (x) => {
          x.Node("param", {
            name: "ruleDisabled",
            value: (this.props.enabled ?? true) ? "true" : "false",
          });

          let keep = this.props.keep;
          if (keep.length === 0 || keep[0] === "everything") {
            keep = ["artifacts", "logs", "statistics"];
          }

          keep.forEach((v, i) => {
            i++;
            x.Node("param", {
              name: `keepData.${i}.type`,
              value: v,
            });
            if (v === "artifacts") {
              x.Node(
                "param",
                { name: `keepData.${i}.artifactPatterns` },
                (x) =>
                  x.CDATA(
                    (this.props.artifactPatterns ?? ["+:**/*"]).join("\n"),
                  ),
              );
            }
          });

          x.Node("param", {
            name: "preserveArtifacts",
            value: (this.props.keepDependantArtifacts ?? true)
              ? "true"
              : "false",
          });

          let filterCount = 0;

          const status = this.props.filter?.status ?? "successful";
          if (status !== "any") {
            filterCount++;
            x.Node("param", {
              name: `filters.${filterCount}.type`,
              value: "buildStatus",
            });
            x.Node("param", {
              name: `filters.${filterCount}.status`,
              value: status,
            });
          }

          if (typeof this.props.filter?.personal !== "undefined") {
            filterCount++;
            x.Node("param", {
              name: `filters.${filterCount}.type`,
              value: "personalBuild",
            });
            x.Node("param", {
              name: `filters.${filterCount}.personal`,
              value: this.props.filter.personal ? "personal" : "not_personal",
            });
          }

          if (typeof this.props.filter?.tags !== "undefined") {
            filterCount++;
            x.Node("param", {
              name: `filters.${filterCount}.type`,
              value: "tags",
            });
            x.Node(
              "param",
              { name: `filters.${filterCount}.tagsList` },
              (x) => x.CDATA(this.props.filter!.tags!.join("\n")),
            );
          }

          if (typeof this.props.filter?.branches !== "undefined") {
            filterCount++;
            x.Node("param", {
              name: `filters.${filterCount}.type`,
              value: "branchPattern",
            });
            x.Node(
              "param",
              { name: `filters.${filterCount}.pattern` },
              (x) => x.CDATA(this.props.filter!.branches!.join("\n")),
            );
          }

          if (typeof this.props.filter?.onlyActiveBranches !== "undefined") {
            filterCount++;
            x.Node("param", {
              name: `filters.${filterCount}.type`,
              value: "branchActivity",
            });
            x.Node("param", {
              name: `filters.${filterCount}.activity`,
              value: this.props.filter.onlyActiveBranches
                ? "active"
                : "inactive",
            });
          }

          x.Node("param", {
            name: "limit.type",
            value: this.props.range?.type ?? "all",
          });

          if (typeof this.props.range !== "undefined") {
            x.Node("param", {
              name: `limit.${
                this.props.range.type === "lastNBuilds"
                  ? "buildsCount"
                  : "daysCount"
              }`,
              value: this.props.range.n.toString(),
            });
          }

          if (this.props.filter?.perBranch === true) {
            x.Node("param", {
              name: "partitions.1.type",
              value: "perBranch",
            });
          }
        });
      },
    );
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new KeepRulesBuildExtension to a Build.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.Build({id: "MyBuild"}, (b) => {
     *    b.KeepRulesExtension({ ... });
     *  });
     * });
     * ```
     */
    KeepRulesExtension(
      props: KeepRulesBuildExtensionProps,
    ): KeepRulesBuildExtension;
  }
}

Build.prototype.KeepRulesExtension = function (
  this: Build,
  props: KeepRulesBuildExtensionProps,
) {
  return new KeepRulesBuildExtension(this, props);
};
