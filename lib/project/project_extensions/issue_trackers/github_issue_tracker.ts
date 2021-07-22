import { AllXOR } from "../../../types.ts";
import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseIssueTracker,
  BaseIssueTrackerProps,
} from "./base_issue_tracker.ts";

export interface GithubIssueTrackerProps extends BaseIssueTrackerProps {
  /**
   * The url to your Github repository.
   */
  readonly repositoryUrl: string;

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
   * Credentials to log in to the issue tracker, if it requires authorization.
   *
   * > HINT: Authentication via login/password is deprecated by GitHub.
   * > We highly recommend that you authenticate with access tokens instead.
   */
  auth?: AllXOR<[{
    /**
     * A Github Token.
     *
     * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
     * > here, instead preferring a password parameter you can still do that but
     * > you will have to cast the string. This is hard on purpose, you should
     * > always prefer `credentialsJSON` over a parameter with a password spec.
     */
    token: `credentialsJSON:${string}`;
  }, {
    /**
     * The github username.
     *
     * > HINT: Authentication via login/password is deprecated by GitHub.
     * > We highly recommend that you authenticate with access tokens instead.
     */
    username: string;

    /**
     * The github password for the given username.
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
 * Connect TeamCity to a Github Issue Tracker.
 *
 * see: https://www.jetbrains.com/help/teamcity/2020.2/github.html
 */
export class GithubIssueTracker
  extends BaseIssueTracker<GithubIssueTrackerProps> {
  constructor(scope: Project, props: GithubIssueTrackerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("GithubIssues", (x) => {
      x.Node("param", {
        name: "repository",
        value: this.props.repositoryUrl,
      });

      x.Node("param", {
        name: "pattern",
        value: this.props.pattern ?? "#(\d+)",
      });

      x.Node("param", {
        name: "authType",
        value: this.props.auth
          ? (this.props.auth.token ? "accesstoken" : "loginpassword")
          : "anonymous",
      });

      if (typeof this.props.auth !== "undefined") {
        if (typeof this.props.auth.token !== "undefined") {
          x.Node("param", {
            name: "secure:accessToken",
            value: this.props.auth.token,
          });
        }
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
        }
      }
    });
  }
}

declare module "../../project.ts" {
  interface Project {
    /**
     * Adds a new GithubIssueTracker to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.GithubIssueTracker({ });
     * });
     * ```
     */
    GithubIssueTracker(
      props: GithubIssueTrackerProps,
    ): GithubIssueTracker;
  }
}

Project.prototype.GithubIssueTracker = function (
  this: Project,
  props: GithubIssueTrackerProps,
) {
  return new GithubIssueTracker(this, props);
};
