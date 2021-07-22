import { XmlElement } from "../../../xml.ts";
import { Build } from "../../build.ts";
import {
  BaseCommitStatusPublisher,
  BaseCommitStatusPublisherProps,
} from "./base_commit_status_publisher.ts";

export interface GithubCommitStatusPublisherProps
  extends BaseCommitStatusPublisherProps {
  /**
   * The URL of the Github API to talk to.
   *
   * Defaults to `https://api.github.com`.
   *
   * > HINT: `http[s]://<host>[:<port>]/api/v3` for GitHub Enterprise.
   */
  url?: string;

  /**
   * Use a personal access token or obtain a token through an OAuth connection.
   *
   * The token must have the following scopes:
   * - for public repositories: public_repo and repo:status
   * - for private repositories: repo
   *
   * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
   * > here, instead preferring a password parameter you can still do that but
   * > you will have to cast the string. This is hard on purpose, you should
   * > always prefer `credentialsJSON` over a parameter with a password spec.
   */
  token: `credentialsJSON:${string}`;

  // NOTE: Not even going to bother modeling the Username/Password option.
}

/**
 * Publish commit statuses to Github / Github Enterprise
 *
 * see: https://www.jetbrains.com/help/teamcity/commit-status-publisher.html#GitHub
 */
export class GithubCommitStatusPublisher
  extends BaseCommitStatusPublisher<GithubCommitStatusPublisherProps> {
  constructor(scope: Build, props: GithubCommitStatusPublisherProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("githubStatusPublisher", (x) => {
      x.Node("param", { name: "github_authentication_type", value: "token" });
      x.Node("param", {
        name: "secure:github_access_token",
        value: this.props.token,
      });
      x.Node("param", {
        name: "github_host",
        value: this.props.url ?? "https://api.github.com",
      });
    });
  }
}

declare module "../../build.ts" {
  interface Build {
    /**
     * Adds a new GithubCommitStatusPublisher to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.GithubCommitStatusPublisher({ ... });
     *  });
     * });
     * ```
     */
    GithubCommitStatusPublisher(
      props: GithubCommitStatusPublisherProps,
    ): GithubCommitStatusPublisher;
  }
}

Build.prototype.GithubCommitStatusPublisher = function (
  this: Build,
  props: GithubCommitStatusPublisherProps,
) {
  return new GithubCommitStatusPublisher(this, props);
};
