import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseIssueTracker,
  BaseIssueTrackerProps,
} from "./base_issue_tracker.ts";

export interface JiraIssueTrackerProps extends BaseIssueTrackerProps {
  /**
   * The url to your Jira server.
   *
   * > HINT: Using Jira Cloud, your URL will be something like:
   * > `https://<my-org>.atlassian.net`
   */
  readonly serverUrl: string;

  /**
   * Enter username for self-hosted Jira or email for Jira Cloud.
   */
  readonly username: string;

  /**
   * Enter password for self-hosted Jira or access token for Jira Cloud
   */
  readonly password: string;

  /**
   * A list of Jira Project Keys to watch.
   *
   * If none provided then all keys will be automatically synchronized.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/integrating-teamcity-with-issue-tracker.html#Converting+Strings+into+Links+to+Issues
   */
  projectKeys?: string[];

  /**
   * OAuth credentials to send build/deploy information to Jira Cloud.
   *
   * Since version 2020.1, TeamCity can report build statuses directly to
   * Jira Cloud in real time. To configure this extra option, you need to
   * provide the Jira Client ID and Server secret when configuring a
   * connection and add a respective build feature.
   *
   * > HINT: This is applicable only to Jira Cloud.
   */
  oAuth?: {
    /**
     * The oAuth Client ID.
     */
    clientId: string;

    /**
     * The oAuth Client secret.
     *
     * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
     * > here, instead preferring a password parameter you can still do that but
     * > you will have to cast the string. This is hard on purpose, you should
     * > always prefer `credentialsJSON` over a parameter with a password spec.
     */
    clientSecret: `credentialsJSON:${string}`;
  };
}

/**
 * Connect TeamCity to a Jira Issue Tracker.
 *
 * see: https://www.jetbrains.com/help/teamcity/2020.2/jira.html
 */
export class JiraIssueTracker extends BaseIssueTracker<JiraIssueTrackerProps> {
  constructor(scope: Project, props: JiraIssueTrackerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("jira", (x) => {
      x.Node("param", {
        name: "host",
        value: this.props.serverUrl,
      });

      const keys = this.props.projectKeys ?? [];
      if (keys.length > 0) {
        x.Node("param", { name: "autoSync", value: "false" });
        x.Node("param", { name: "idPrefix", value: keys.join(" ") });
      } else {
        x.Node("param", { name: "autoSync", value: "true" });
      }

      x.Node("param", { name: "username", value: this.props.username });
      x.Node("param", { name: "secure:password", value: this.props.password });

      if (typeof this.props.oAuth !== "undefined") {
        x.Node("param", {
          name: "jiraCloudClientId",
          value: this.props.oAuth.clientId,
        });
        x.Node("param", {
          name: "secure:jiraCloudServerSecret",
          value: this.props.oAuth.clientSecret,
        });
      }
    });
  }
}

declare module "../../project.ts" {
  interface Project {
    /**
     * Adds a new JiraIssueTracker to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.JiraIssueTracker({ });
     * });
     * ```
     */
    JiraIssueTracker(
      props: JiraIssueTrackerProps,
    ): JiraIssueTracker;
  }
}

Project.prototype.JiraIssueTracker = function (
  this: Project,
  props: JiraIssueTrackerProps,
) {
  return new JiraIssueTracker(this, props);
};
