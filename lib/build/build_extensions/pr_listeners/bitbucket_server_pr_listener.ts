import { Build } from "../../build.ts";
import { XmlElement } from "../../../xml.ts";
import { BasePrListener, BasePrListenerProps } from "./base_pr_listener.ts";

export interface BitbucketServerPRListenerProps extends BasePrListenerProps {
  /**
   * TeamCity will try to extract username/password credentials from the VCS
   * root settings if the VCS root uses HTTP(S) fetch URL.
   *
   * This option will not work if the VCS root uses an SSH fetch URL
   * or employs anonymous authentication.
   *
   * Or specify a username and password for connection to Bitbucket Server.
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
   * Specify a Bitbucket URL for connection.
   *
   * If left blank, the URL will be extracted from the VCS root fetch URL.
   */
  serverUrl?: string;
}

/**
 * This feature monitors builds only on the `refs/pull-requests/{{star}}/from` branch.
 *
 * **!!! IMPORTANT !!!**
 *
 * If you point this feature to a public repository and the current build
 * configuration can be triggered automatically, please be aware that
 * arbitrary users might use this to execute malicious code on your
 * build agents.
 *
 * see: https://www.jetbrains.com/help/teamcity/pull-requests.html#Bitbucket+Server+Pull+Requests
 */
export class BitbucketServerPRListener
  extends BasePrListener<BitbucketServerPRListenerProps> {
  constructor(scope: Build, props: BitbucketServerPRListenerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("bitbucketServer", (x) => {
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
     * Adds a new BitbucketServerPRListener to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.BitbucketServerPRListener({ ... });
     *  });
     * });
     * ```
     */
    BitbucketServerPRListener(
      props: BitbucketServerPRListenerProps,
    ): BitbucketServerPRListener;
  }
}

Build.prototype.BitbucketServerPRListener = function (
  this: Build,
  props: BitbucketServerPRListenerProps,
) {
  return new BitbucketServerPRListener(this, props);
};
