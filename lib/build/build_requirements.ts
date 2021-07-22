import { Build } from "./build.ts";
import { Construct } from "../construct.ts";
import { XmlElement } from "../xml.ts";

export type BuildRequirementsProps =
  | WithValueBuildRequirement
  | WithoutValueBuildRequirement;

interface BaseBuildRequirement extends Record<string, unknown> {
  /**
   * This ID is not exposed in UI and is just an incrementing number.
   *
   * eg: `RQ_1`, `RQ_2`, `RQ_3`, etc...
   *
   * So if not set it will be set for you.
   */
  readonly id: string;

  /**
   * The name of some parameter to match against.
   *
   * eg: `teamcity.agent.jvm.os.name`
   *
   * > HINT: The left hand side of the expression.
   */
  readonly name: string;
}

interface WithValueBuildRequirement extends BaseBuildRequirement {
  /**
   * A logical condition to apply to the parameter.
   */
  readonly condition:
    | "equals"
    | "does-not-equal"
    | "more-than"
    | "no-more-than"
    | "less-than"
    | "no-less-than"
    | "starts-with"
    | "contains"
    | "does-not-contain"
    | "ends-with"
    | "matches"
    | "does-not-match"
    | "ver-more-than"
    | "ver-no-more-than"
    | "ver-less-than"
    | "ver-no-less-than";

  /**
   * The expected value for this build requirement to evaluate to true.
   *
   * > HINT: The right hand side of the expression.
   */
  readonly value?: string;
}

interface WithoutValueBuildRequirement extends BaseBuildRequirement {
  /**
   * A logical condition to apply to the parameter.
   */
  readonly condition:
    | "exists"
    | "not-exists";
}

export class BuildRequirements
  extends Construct<BuildRequirementsProps, Build> {
  constructor(scope: Build, props: BuildRequirementsProps) {
    super(scope, props);
    Construct.push(scope, "requirements", this);
    scope["_addXmlBuilder"](BuildRequirements, (x) => {
      x.Node("requirements", (x) => {
        for (const requirement of scope.requirements ?? []) {
          x.Node(requirement.toXml());
        }
      });
    });
  }

  toXml(): XmlElement {
    return new XmlElement(this.props.condition, {
      id: this.props.id,
      name: this.props.name,
    }, (x) => {
      if (typeof this.props.value !== "undefined") {
        x.Attribute("value", this.props.value as string);
      }
    });
  }
}

declare module "./build.ts" {
  interface Build {
    /**
     * Agent requirements are used in TeamCity to specify whether a build
     * configuration can run on a particular build agent besides agent pools
     * and specified build configuration restrictions.
     *
     * When a build agent registers on the TeamCity server, it provides information
     * about its configuration, including its environment variables, system properties,
     * and additional settings specified in the buildAgent.properties file.
     *
     * The administrator can specify required environment variables and system
     * properties for a build configuration on the Build Configuration Settings |
     * Agent Requirements page.
     *
     * For instance, if a particular build configuration must run on a build agent
     * running Windows, the administrator specifies this by adding a requirement
     * that the `teamcity.agent.jvm.os.name` system property on the build agent
     * must contain the `Windows` string.

    * see: https://www.jetbrains.com/help/teamcity/agent-requirements.html
    */
    readonly requirements?: readonly BuildRequirements[];

    /**
     * Adds a new BuildRequirements to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.Requirement({ ... });
     *  });
     * });
     * ```
     */
    Requirement(props: BuildRequirementsProps): BuildRequirements;
  }
}

Build.prototype.Requirement = function (
  this: Build,
  props: BuildRequirementsProps,
) {
  return new BuildRequirements(this, props);
};
