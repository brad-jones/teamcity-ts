import { Build } from "../../build.ts";
import { XmlElement } from "../../../xml.ts";
import { BasePrListener, BasePrListenerProps } from "./base_pr_listener.ts";

export interface AzureDevOpsPRListenerProps extends BasePrListenerProps {
  /**
   * Use a personal access token for connection.
   *
   * The token must have the Code (read) scope.
   *
   * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
   * > here, instead preferring a password parameter you can still do that but
   * > you will have to cast the string. This is hard on purpose, you should
   * > always prefer `credentialsJSON` over a parameter with a password spec.
   *
   * see: https://docs.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/oauth?view=azure-devops#scopes
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
   * Specify a project URL for synchronization with the remote Azure DevOps server.
   * This field is recommended for on-premises Azure DevOps installations.
   * If left blank, the URL will be composed based on the VCS root fetch URL.
   */
  projectUrl?: string;
}

/**
 * This feature monitors builds only on the `refs/pull/{{star}}/merge` branch.
 *
 * In case with Azure DevOps, TeamCity detects requests on a merge branch,
 * not on the pull request itself as with other VCSs. Each build will be
 * launched on a virtual branch showing an actual result of the build after
 * merging the PR. Thus, the build will contain both the commit with changes
 * and the virtual merge commit.
 *
 * > HINT: This feature ignores Azure DevOps draft pull requests.
 *
 * **!!! IMPORTANT !!!**
 *
 * If you point this feature to a public repository and the current build
 * configuration can be triggered automatically, please be aware that
 * arbitrary users might use this to execute malicious code on your
 * build agents.
 *
 * see: https://www.jetbrains.com/help/teamcity/pull-requests.html#Azure+DevOps+Pull+Requests
 */
export class AzureDevOpsPRListener
  extends BasePrListener<AzureDevOpsPRListenerProps> {
  constructor(scope: Build, props: AzureDevOpsPRListenerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("azureDevOps", (x) => {
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

      if (typeof this.props.projectUrl !== "undefined") {
        x.Node("param", { name: "projectUrl", value: this.props.projectUrl });
      }
    });
  }
}

declare module "../../build.ts" {
  interface Build {
    /**
     * Adds a new AzureDevOpsPRListener to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.AzureDevOpsPRListener({ ... });
     *  });
     * });
     * ```
     */
    AzureDevOpsPRListener(
      props: AzureDevOpsPRListenerProps,
    ): AzureDevOpsPRListener;
  }
}

Build.prototype.AzureDevOpsPRListener = function (
  this: Build,
  props: AzureDevOpsPRListenerProps,
) {
  return new AzureDevOpsPRListener(this, props);
};
