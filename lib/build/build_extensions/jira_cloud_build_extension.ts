import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface JiraCloudBuildExtensionProps extends BaseBuildExtensionProps {
  /**
   * An id of a `ProjectExtensionIssueTrackerJira` object.
   */
  issueTrackerConnectionId: string;

  /**
   * Environment information is required to show deployment status in Jira Cloud.
   */
  environmentType:
    | "production"
    | "staging"
    | "testing"
    | "development"
    | "unmapped";

  environmentName: string;
}

/**
 * The Jira Cloud Integration build feature allows reporting build statuses
 * directly to Jira Cloud in real time.
 *
 * > HINT: This feature uses the Jira Software Cloud REST API and requires
 * > additional authentication parameters comparing to the regular integration
 * > with Jira. Before adding this feature to your build configuration, you
 * > need to create an issue tracker connection to Jira in the parent project's
 * > settings and provide the OAuth client ID/secret there.
 *
 * see: https://www.jetbrains.com/help/teamcity/jira-cloud-integration.html
 */
export class JiraCloudBuildExtension
  extends BaseBuildExtension<JiraCloudBuildExtensionProps> {
  constructor(scope: Build, props: JiraCloudBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("jiraCloud", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", { name: "deployment", value: "true" });
        x.Node("param", {
          name: "environmentName",
          value: this.props.environmentName,
        });
        x.Node("param", {
          name: "environmentType",
          value: this.props.environmentType,
        });
        x.Node("param", {
          name: "issueTrackerConnectionId",
          value: this.props.issueTrackerConnectionId,
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new JiraCloudBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.JiraCloudExtension({ ... });
     *  });
     * });
     * ```
     */
    JiraCloudExtension(
      props: JiraCloudBuildExtensionProps,
    ): JiraCloudBuildExtension;
  }
}

Build.prototype.JiraCloudExtension = function (
  this: Build,
  props: JiraCloudBuildExtensionProps,
) {
  return new JiraCloudBuildExtension(this, props);
};
