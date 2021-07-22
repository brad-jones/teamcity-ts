import { Build } from "../build.ts";
import { AllXOR } from "../../types.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface FailureOnMessageBuildExtensionProps
  extends BaseBuildExtensionProps {
  /**
   * Fail build if its build log contains some string.
   *
   * Default to `true`.
   *
   * > HINT: Set to false to invert the logic. ie: does not contain
   */
  contains?: boolean;

  /**
   * Either an exact string to match on or a _"Java"_ regular expression.
   */
  match: AllXOR<[{
    /**
     * The exact sub string to match.
     */
    exact: string;
  }, {
    /**
     * A _"Java"_ regular expression.
     *
     * see: http://java.sun.com/javase/6/docs/api/java/util/regex/Pattern.html
     */
    pattern: string;
  }]>;

  /**
   * An optional message to display in the UI and the build log
   * when this Failure Condition matches.
   */
  failureMsg?: string;

  /**
   * Immediately stop the build if it fails due to the condition.
   *
   * Defaults to `true`.
   */
  stopBuild?: boolean;
}

/**
 * TeamCity can inspect all lines in a build log for some particular text
 * occurrence that indicates a build failure.
 *
 * When matching lines, the time and block name prefixes preceding each log
 * message are ignored.
 *
 * see: https://www.jetbrains.com/help/teamcity/build-failure-conditions.html#Fail+build+on+specific+text+in+build+log
 */
export class FailureOnMessageBuildExtension
  extends BaseBuildExtension<FailureOnMessageBuildExtensionProps> {
  constructor(scope: Build, props: FailureOnMessageBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("BuildFailureOnMessage", (x) => {
      x.Node("parameters", (x) => {
        if (typeof this.props.match.exact !== "undefined") {
          x.Node("param", {
            name: "buildFailureOnMessage.conditionType",
            value: "contains",
          });
          x.Node("param", {
            name: "buildFailureOnMessage.messagePattern",
            value: this.props.match.exact,
          });
        } else {
          if (typeof this.props.match.pattern !== "undefined") {
            x.Node("param", {
              name: "buildFailureOnMessage.conditionType",
              value: "matchesRegex",
            });
            x.Node("param", {
              name: "buildFailureOnMessage.messagePattern",
              value: this.props.match.pattern,
            });
          } else {
            throw new Error("unexpected match object");
          }
        }

        if (typeof this.props.failureMsg !== "undefined") {
          x.Node("param", {
            name: "buildFailureOnMessage.outputText",
            value: this.props.failureMsg,
          });
        }

        x.Node("param", {
          name: "buildFailureOnMessage.reverse",
          value: (this.props.contains ?? true) ? "false" : "true",
        });

        x.Node("param", {
          name: "buildFailureOnMessage.stopBuildOnFailure",
          value: (this.props.stopBuild ?? true) ? "true" : "false",
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new FailureOnMessageBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.FailureOnMessageExtension({ ... });
     *  });
     * });
     * ```
     */
    FailureOnMessageExtension(
      props: FailureOnMessageBuildExtensionProps,
    ): FailureOnMessageBuildExtension;
  }
}

Build.prototype.FailureOnMessageExtension = function (
  this: Build,
  props: FailureOnMessageBuildExtensionProps,
) {
  return new FailureOnMessageBuildExtension(this, props);
};
