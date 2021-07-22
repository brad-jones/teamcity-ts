import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseIssueTracker,
  BaseIssueTrackerProps,
} from "./base_issue_tracker.ts";

export interface BugzillaIssueTrackerProps extends BaseIssueTrackerProps {
  /**
   * The url to your bugzilla server.
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
   * Credentials to log in to the issue tracker, if it requires authorization.
   *
   * > HINT: If the username and password are specified, you need to have
   * > Bugzilla XML-RPC interface switched on. This is not required if you
   * > use anonymous access to Bugzilla without the username and password.
   */
  auth?: {
    /**
     * The username used to connect to Bugzilla.
     */
    username: string;

    /**
     * The password used to connect to Bugzilla
     *
     * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
     * > here, instead preferring a password parameter you can still do that but
     * > you will have to cast the string. This is hard on purpose, you should
     * > always prefer `credentialsJSON` over a parameter with a password spec.
     */
    password: `credentialsJSON:${string}`;
  };
}

/**
 * Connext TeamCity to a Bugzilla Issue Tracker.
 *
 * see: https://www.jetbrains.com/help/teamcity/2020.2/bugzilla.html
 */
export class BugzillaIssueTracker
  extends BaseIssueTracker<BugzillaIssueTrackerProps> {
  constructor(scope: Project, props: BugzillaIssueTrackerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("bugzilla", (x) => {
      x.Node("param", { name: "host", value: this.props.serverUrl });
      x.Node("param", {
        name: "pattern",
        value: this.props.pattern ?? "#(\d+)",
      });

      x.Node("param", {
        name: "authType",
        value: this.props.auth ? "loginpassword" : "anonymous",
      });

      if (typeof this.props.auth !== "undefined") {
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
     * Adds a new BugzillaIssueTracker to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.BugzillaIssueTracker({ });
     * });
     * ```
     */
    BugzillaIssueTracker(
      props: BugzillaIssueTrackerProps,
    ): BugzillaIssueTracker;
  }
}

Project.prototype.BugzillaIssueTracker = function (
  this: Project,
  props: BugzillaIssueTrackerProps,
) {
  return new BugzillaIssueTracker(this, props);
};
