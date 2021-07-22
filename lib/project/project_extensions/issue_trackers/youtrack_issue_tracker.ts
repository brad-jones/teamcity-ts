import { AllXOR } from "../../../types.ts";
import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseIssueTracker,
  BaseIssueTrackerProps,
} from "./base_issue_tracker.ts";

export interface YoutrackIssueTrackerProps extends BaseIssueTrackerProps {
  /**
   * The url to your YouTrack server.
   */
  readonly serverUrl: string;

  /**
   * Credentials to log in to the issue tracker.
   */
  readonly auth: AllXOR<[{
    /**
     * A YouTrack Token.
     *
     * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
     * > here, instead preferring a password parameter you can still do that but
     * > you will have to cast the string. This is hard on purpose, you should
     * > always prefer `credentialsJSON` over a parameter with a password spec.
     */
    readonly token: `credentialsJSON:${string}`;
  }, {
    /**
     * The YouTrack username.
     *
     * > HINT: Authentication via login/password is deprecated by GitHub.
     * > We highly recommend that you authenticate with access tokens instead.
     */
    readonly username: string;

    /**
     * The YouTrack password for the given username.
     *
     * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
     * > here, instead preferring a password parameter you can still do that but
     * > you will have to cast the string. This is hard on purpose, you should
     * > always prefer `credentialsJSON` over a parameter with a password spec.
     */
    readonly password: `credentialsJSON:${string}`;
  }]>;

  /**
   * A list of Project IDs to watch.
   *
   * If none provided then all IDs will be automatically synchronized.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/integrating-teamcity-with-issue-tracker.html#Converting+Strings+into+Links+to+Issues
   */
  projectIDs?: string[];
}

/**
 * Connect TeamCity to a Jet Brains YouTrack Issue Tracker.
 *
 * see: https://www.jetbrains.com/help/teamcity/2020.2/youtrack.html
 */
export class YoutrackIssueTracker
  extends BaseIssueTracker<YoutrackIssueTrackerProps> {
  constructor(scope: Project, props: YoutrackIssueTrackerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("youtrack", (x) => {
      x.Node("param", { name: "host", value: this.props.serverUrl });

      const ids = this.props.projectIDs ?? [];
      if (ids.length > 0) {
        x.Node("param", { name: "autoSync", value: "false" });
        x.Node("param", { name: "idPrefix", value: ids.join(" ") });
      } else {
        x.Node("param", { name: "autoSync", value: "true" });
      }

      x.Node("param", {
        name: "authType",
        value: this.props.auth.token ? "accesstoken" : "loginpassword",
      });

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
        x.Node("param", { name: "username", value: this.props.auth.username });
        x.Node("param", {
          name: "secure:password",
          value: this.props.auth.password,
        });
      }
    });
  }
}

declare module "../../project.ts" {
  interface Project {
    /**
     * Adds a new YoutrackIssueTracker to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.YoutrackIssueTracker({ });
     * });
     * ```
     */
    YoutrackIssueTracker(
      props: YoutrackIssueTrackerProps,
    ): YoutrackIssueTracker;
  }
}

Project.prototype.YoutrackIssueTracker = function (
  this: Project,
  props: YoutrackIssueTrackerProps,
) {
  return new YoutrackIssueTracker(this, props);
};
