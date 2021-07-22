import { Build } from "../../build.ts";
import { XmlElement } from "../../../xml.ts";
import { BasePrListener, BasePrListenerProps } from "./base_pr_listener.ts";

export interface GitlabPRListenerProps extends BasePrListenerProps {
  /**
   * The personal access token to used to connect to gitlab.
   *
   * It must have api scope.
   *
   * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
   * > here, instead preferring a password parameter you can still do that but
   * > you will have to cast the string. This is hard on purpose, you should
   * > always prefer `credentialsJSON` over a parameter with a password spec.
   */
  accessToken: `credentialsJSON:${string}`;

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
   * Specify a GitLab URL for connection.
   *
   * If left blank, the URL will be extracted from the VCS root fetch URL.
   */
  serverUrl?: string;
}

/**
 * TeamCity processes GitLab merge requests similarly to how it processes pull
 * requests in other hosting services. Currently, TeamCity detects only merge
 * requests submitted after this build feature is enabled.
 *
 * This feature monitors builds only on the `refs/merge-requests/{{star}}/head` branch.
 *
 * **!!! IMPORTANT !!!**
 *
 * If you point this feature to a public repository and the current build
 * configuration can be triggered automatically, please be aware that
 * arbitrary users might use this to execute malicious code on your
 * build agents.
 *
 * see: https://www.jetbrains.com/help/teamcity/pull-requests.html#GitLab+Merge+Requests
 */
export class GitlabPRListener extends BasePrListener<GitlabPRListenerProps> {
  constructor(scope: Build, props: GitlabPRListenerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("gitlab", (x) => {
      x.Node("param", { name: "authenticationType", value: "token" });
      x.Node("param", {
        name: "secure:accessToken",
        value: this.props.accessToken,
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
     * Adds a new GitlabPRListener to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.GitlabPRListener({ ... });
     *  });
     * });
     * ```
     */
    GitlabPRListener(
      props: GitlabPRListenerProps,
    ): GitlabPRListener;
  }
}

Build.prototype.GitlabPRListener = function (
  this: Build,
  props: GitlabPRListenerProps,
) {
  return new GitlabPRListener(this, props);
};
