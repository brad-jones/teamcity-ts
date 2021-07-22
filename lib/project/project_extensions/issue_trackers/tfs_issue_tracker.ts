import { AllXOR } from "../../../types.ts";
import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseIssueTracker,
  BaseIssueTrackerProps,
} from "./base_issue_tracker.ts";

export interface TfsIssueTrackerProps extends BaseIssueTrackerProps {
  /**
   * The url to your TFS server.
   *
   * URL format:
   * - TFS: `http[s]://<host>[:<port>]/tfs/<collection>/<project>`
   * - Azure DevOps: `https://dev.azure.com/<organization>/<project>`
   * - VSTS: `https://<account>.visualstudio.com/<project>`
   */
  readonly serverUrl: string;

  /**
   * Issue ID Pattern: a Java Regular Expression pattern to find the issue ID
   * in the text. The matched text (or the first group if there are groups
   * defined) is used as the issue number.
   *
   * Defaults to: `#(\d+)`.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/integrating-teamcity-with-issue-tracker.html#Converting+Strings+into+Links+to+Issues
   * also: http://java.sun.com/j2se/1.5.0/docs/api/java/util/regex/Pattern.html
   */
  pattern?: string;

  /**
   * You should probably prefer token based auth.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/team-foundation-server.html#Authentication+Notes
   */
  auth: AllXOR<[{
    /**
     * A Personal Access Token.
     *
     * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
     * > here, instead preferring a password parameter you can still do that but
     * > you will have to cast the string. This is hard on purpose, you should
     * > always prefer `credentialsJSON` over a parameter with a password spec.
     */
    token: `credentialsJSON:${string}`;
  }, {
    /**
     * To use the user/pass pair authentication, you have to enable alternate
     * credentials in your Azure DevOps account, where you can set a secondary
     * username and password to use when configuring a VCS root.
     *
     * > HINT: Azure DevOps stops supporting alternate credentials since March 2, 2020.
     * > To be able to authenticate in Azure DevOps, please use alternative methods
     * > instead (such as personal access tokens).
     */
    username: string;

    /**
     * The password for the given username.
     *
     * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
     * > here, instead preferring a password parameter you can still do that but
     * > you will have to cast the string. This is hard on purpose, you should
     * > always prefer `credentialsJSON` over a parameter with a password spec.
     */
    password: `credentialsJSON:${string}`;
  }]>;
}

/**
 * Connect TeamCity to a TFS based Issue Tracker. aka: Azure DevOps
 *
 * see: https://www.jetbrains.com/help/teamcity/2020.2/team-foundation-work-items.html
 */
export class TfsIssueTracker extends BaseIssueTracker<TfsIssueTrackerProps> {
  constructor(scope: Project, props: TfsIssueTrackerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("tfs", (x) => {
      x.Node("param", { name: "host", value: this.props.serverUrl });
      x.Node("param", {
        name: "pattern",
        value: this.props.pattern ?? "#(\d+)",
      });

      if (typeof this.props.auth.token !== "undefined") {
        x.Node("param", {
          name: "secure:password",
          value: this.props.auth.token,
        });
      } else {
        if (
          typeof this.props.auth.username !== "undefined" &&
          typeof this.props.auth.password !== "undefined"
        ) {
          x.Node("param", {
            name: "username",
            value: this.props.auth.username,
          });
          x.Node("param", {
            name: "secure:password",
            value: this.props.auth.password,
          });
        } else {
          throw new Error(
            "tfs issue tracker expects a single token for auth or a user/pass pair",
          );
        }
      }
    });
  }
}

declare module "../../project.ts" {
  interface Project {
    /**
     * Adds a new TfsIssueTracker to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.TfsIssueTracker({ });
     * });
     * ```
     */
    TfsIssueTracker(
      props: TfsIssueTrackerProps,
    ): TfsIssueTracker;
  }
}

Project.prototype.TfsIssueTracker = function (
  this: Project,
  props: TfsIssueTrackerProps,
) {
  return new TfsIssueTracker(this, props);
};
