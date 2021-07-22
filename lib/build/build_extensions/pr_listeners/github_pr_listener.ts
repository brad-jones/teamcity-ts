import { XmlElement } from "../../../xml.ts";
import { Build } from "../../build.ts";
import { BasePrListener, BasePrListenerProps } from "./base_pr_listener.ts";

export interface GithubPRListenerProps extends BasePrListenerProps {
  /**
   * TeamCity will try to extract username/password credentials or a personal
   * access token/x-oauth-basic from the VCS root settings if the VCS root uses
   * HTTP(S) fetch URL.
   *
   * This option will not work if the VCS root employs anonymous authentication
   * or SSH.
   *
   * For a GitHub Enterprise repository, only the personal access token/
   * x-oauth-basic pair will work.
   *
   * Or provide a specific personal access token or obtain a token through an
   * OAuth connection. It must have either the `public_repo` (for public repositories)
   * or `repo` (for private repositories) scope.
   */
  authType: "vcsRoot" | {
    /**
     * The access token to used to connect to github.
     *
     * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
     * > here, instead preferring a password parameter you can still do that but
     * > you will have to cast the string. This is hard on purpose, you should
     * > always prefer `credentialsJSON` over a parameter with a password spec.
     */
    accessToken: `credentialsJSON:${string}`;
  };

  /**
   * Trigger PR builds based on who submitted the PR.
   *
   * - `MEMBER`: Only detects pull requests submitted by members of the same
   *   organization in GitHub.
   *
   * - `MEMBER_OR_COLLABORATOR`: Only detects pull requests submitted by members
   *   of the same organization and external collaborators in GitHub.
   *
   * - `EVERYBODY`: Detects all pull requests. Be aware that selecting this
   *   option may allow arbitrary users to execute malicious code on your
   *   build agents.
   *
   * > HINT: The filter applies to public repositories only.
   *
   * Defaults to `MEMBER`.
   *
   * see: https://www.jetbrains.com/help/teamcity/pull-requests.html#GitHub+Pull+Requests
   */
  byAuthors?: "MEMBER" | "MEMBER_OR_COLLABORATOR" | "EVERYBODY";

  /**
   * Define the branch filter to monitor pull requests only on source branches
   * that match the specified criteria. If left blank, no filters apply.
   *
   * see: https://www.jetbrains.com/help/teamcity/branch-filter.html
   */
  bySourceBranch?: string[];

  /**
   * Define the branch filter to monitor pull requests only on target branches
   * that match the specified criteria. If left blank, no filters apply.
   *
   * see: https://www.jetbrains.com/help/teamcity/branch-filter.html
   */
  byTargetBranch?: string[];

  /**
   * Specify a Github URL for connection.
   *
   * If left blank, the URL will be extracted from the VCS root fetch URL.
   */
  serverUrl?: string;
}

/**
 * This feature supports GitHub and GitHub Enterprise.
 *
 * It monitors builds only on the `refs/pull/{{star}}/head` branch.
 *
 * **!!! IMPORTANT !!!**
 *
 * If you point this feature to a public repository and the current build
 * configuration can be triggered automatically, please be aware that
 * arbitrary users might use this to execute malicious code on your
 * build agents.
 *
 * see: https://www.jetbrains.com/help/teamcity/pull-requests.html#GitHub+Pull+Requests
 */
export class GithubPRListener extends BasePrListener<GithubPRListenerProps> {
  constructor(scope: Build, props: GithubPRListenerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("github", (x) => {
      if (this.props.authType === "vcsRoot") {
        x.Node("param", { name: "authenticationType", value: "vcsRoot" });
      } else {
        x.Node("param", { name: "authenticationType", value: "token" });
        x.Node("param", {
          name: "secure:accessToken",
          value: this.props.authType.accessToken,
        });
      }

      x.Node("param", {
        name: "filterAuthorRole",
        value: this.props.byAuthors ?? "MEMBER",
      });

      if (
        Array.isArray(this.props.bySourceBranch) &&
        this.props.bySourceBranch.length > 0
      ) {
        x.Node(
          "param",
          { name: "filterSourceBranch" },
          (x) => x.CDATA(this.props.bySourceBranch!.join("\n")),
        );
      }

      if (
        Array.isArray(this.props.byTargetBranch) &&
        this.props.byTargetBranch.length > 0
      ) {
        x.Node(
          "param",
          { name: "filterTargetBranch" },
          (x) => x.CDATA(this.props.byTargetBranch!.join("\n")),
        );
      }

      if (typeof this.props.serverUrl !== "undefined") {
        x.Node("param", { name: "serverUrl", value: this.props.serverUrl });
      }
    });
  }
}

declare module "../../build.ts" {
  interface Build {
    /**
     * Adds a new GithubPRListener to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.GithubPRListener({ ... });
     *  });
     * });
     * ```
     */
    GithubPRListener(
      props: GithubPRListenerProps,
    ): GithubPRListener;
  }
}

Build.prototype.GithubPRListener = function (
  this: Build,
  props: GithubPRListenerProps,
) {
  return new GithubPRListener(this, props);
};
