import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseIssueTracker,
  BaseIssueTrackerProps,
} from "./base_issue_tracker.ts";

export interface BitbucketIssueTrackerProps extends BaseIssueTrackerProps {
  /**
   * The url to your bit bucket repository.
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
   */
  auth?: {
    /**
     * The username used to connect to BitBucket.
     *
     * > HINT: For Bitbucket Cloud team accounts, it is possible to use the
     * > team name as the username and the API key as the password.
     */
    username: string;

    /**
     * The password used to connect to Bitbucket
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
 * Connect TeamCity to the Bitbucket Issue Tracker.
 *
 * see: https://www.jetbrains.com/help/teamcity/2020.2/bitbucket-cloud.html
 */
export class BitbucketIssueTracker
  extends BaseIssueTracker<BitbucketIssueTrackerProps> {
  constructor(scope: Project, props: BitbucketIssueTrackerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("BitBucketIssues", (x) => {
      x.Node("param", { name: "repository", value: this.props.repositoryUrl });
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
     * Adds a new BitbucketIssueTracker to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.BitbucketIssueTracker({ });
     * });
     * ```
     */
    BitbucketIssueTracker(
      props: BitbucketIssueTrackerProps,
    ): BitbucketIssueTracker;
  }
}

Project.prototype.BitbucketIssueTracker = function (
  this: Project,
  props: BitbucketIssueTrackerProps,
) {
  return new BitbucketIssueTracker(this, props);
};
