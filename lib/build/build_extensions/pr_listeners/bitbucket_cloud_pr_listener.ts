import { Build } from "../../build.ts";
import { XmlElement } from "../../../xml.ts";
import { BasePrListener, BasePrListenerProps } from "./base_pr_listener.ts";

export interface BitbucketCloudPRListenerProps extends BasePrListenerProps {
  /**
   * TeamCity will try to extract username/password credentials from the VCS
   * root settings if the VCS root uses HTTP(S) fetch URL.
   *
   * This option will not work if the VCS root uses an SSH fetch URL
   * or employs anonymous authentication.
   *
   * Or specify a username and password for connection to Bitbucket Cloud.
   * We recommend using an app password with the Pull Requests | Read scope.
   *
   * see: https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/
   */
  authType: "vcsRoot" | {
    /**
     * The username to use to connect to bitbucket cloud.
     */
    username: string;

    /**
     * The password to use to connect to bitbucket cloud.
     *
     * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
     * > here, instead preferring a password parameter you can still do that but
     * > you will have to cast the string. This is hard on purpose, you should
     * > always prefer `credentialsJSON` over a parameter with a password spec.
     */
    password: `credentialsJSON:${string}`;
  };

  /**
   * Define the branch filter to monitor pull requests only on branches that
   * match the specified criteria. If left blank, no filters apply.
   *
   * see: https://www.jetbrains.com/help/teamcity/branch-filter.html
   */
  byTargetBranch?: string[];
}

/**
 * Since Bitbucket Cloud does not create dedicated branches for pull requests,
 * this build feature monitors directly source branches in a source repository
 * (forks are not supported).
 *
 * If more than one pull request is submitted from the same source branch at
 * the moment of the build start, TeamCity will display all these requests in
 * the build results. However, only commits from the open PRs matching the
 * filtering criteria will be displayed as Changes of the build.
 *
 * **!!! IMPORTANT !!!**
 *
 * If you point this feature to a public repository and the current build
 * configuration can be triggered automatically, please be aware that
 * arbitrary users might use this to execute malicious code on your
 * build agents.
 *
 * see: https://www.jetbrains.com/help/teamcity/pull-requests.html#Bitbucket+Cloud+Pull+Requests
 */
export class BitbucketCloudPRListener
  extends BasePrListener<BitbucketCloudPRListenerProps> {
  constructor(scope: Build, props: BitbucketCloudPRListenerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("bitbucketCloud", (x) => {
      if (this.props.authType === "vcsRoot") {
        x.Node("param", { name: "authenticationType", value: "vcsRoot" });
      } else {
        x.Node("param", { name: "authenticationType", value: "token" });
        x.Node("param", {
          name: "username",
          value: this.props.authType.username,
        });
        x.Node("param", {
          name: "secure:password",
          value: this.props.authType.password,
        });
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
    });
  }
}

declare module "../../build.ts" {
  interface Build {
    /**
     * Adds a new BitbucketCloudPRListener to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.BitbucketCloudPRListener({ ... });
     *  });
     * });
     * ```
     */
    BitbucketCloudPRListener(
      props: BitbucketCloudPRListenerProps,
    ): BitbucketCloudPRListener;
  }
}

Build.prototype.BitbucketCloudPRListener = function (
  this: Build,
  props: BitbucketCloudPRListenerProps,
) {
  return new BitbucketCloudPRListener(this, props);
};
