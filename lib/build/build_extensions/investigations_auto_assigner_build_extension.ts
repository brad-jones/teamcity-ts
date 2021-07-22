import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface InvestigationsAutoAssignerBuildExtensionProps
  extends BaseBuildExtensionProps {
  /**
   * Defaults to `ON_FIRST_FAILURE`.
   */
  assign?: "ON_FIRST_FAILURE" | "ON_SECOND_FAILURE";

  /**
   * Username of a user to assign the investigation to if no other assignee can be found.
   */
  defaultAssignee: string;

  /**
   * Exclude these users from investigation auto-assignment.
   */
  usersToIgnore?: string[];

  /**
   * Build problems to ignore.
   */
  ignore?: {
    /**
     * Defaults to `false`.
     */
    compilationErrors?: boolean;

    /**
     * Defaults to `false`.
     */
    exitCodes?: boolean;
  };
}

/**
 * TeamCity can analyse build problems (for example, compilation errors) and
 * test failures, and try to find a committer to blame for the problem using
 * a number of heuristics.
 *
 * see: https://www.jetbrains.com/help/teamcity/investigations-auto-assigner.html
 */
export class InvestigationsAutoAssignerBuildExtension
  extends BaseBuildExtension<InvestigationsAutoAssignerBuildExtensionProps> {
  constructor(
    scope: Build,
    props: InvestigationsAutoAssignerBuildExtensionProps,
  ) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("InvestigationsAutoAssigner", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", {
          name: "assignOnSecondFailure",
          value:
            (this.props.assign ?? "ON_FIRST_FAILURE") === "ON_FIRST_FAILURE"
              ? "false"
              : "true",
        });

        x.Node("param", {
          name: "defaultAssignee.username",
          value: this.props.defaultAssignee,
        });

        if (
          Array.isArray(this.props.usersToIgnore) &&
          this.props.usersToIgnore.length > 0
        ) {
          x.Node(
            "param",
            { name: "excludeAssignees.usernames" },
            (x) => x.CDATA(this.props.usersToIgnore!.join("\n")),
          );
        }

        x.Node("param", {
          name: "ignoreBuildProblems.compilation",
          value: (this.props.ignore?.compilationErrors ?? false)
            ? "true"
            : "false",
        });

        x.Node("param", {
          name: "ignoreBuildProblems.exitCode",
          value: (this.props.ignore?.exitCodes ?? false) ? "true" : "false",
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new InvestigationsAutoAssignerBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.InvestigationsAutoAssignerExtension({ ... });
     *  });
     * });
     * ```
     */
    InvestigationsAutoAssignerExtension(
      props: InvestigationsAutoAssignerBuildExtensionProps,
    ): InvestigationsAutoAssignerBuildExtension;
  }
}

Build.prototype.InvestigationsAutoAssignerExtension = function (
  this: Build,
  props: InvestigationsAutoAssignerBuildExtensionProps,
) {
  return new InvestigationsAutoAssignerBuildExtension(this, props);
};
