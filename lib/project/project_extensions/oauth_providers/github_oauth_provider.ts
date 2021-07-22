import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseOAuthProvider,
  BaseOAuthProviderProps,
} from "./base_oauth_provider.ts";

export interface GithubOAuthProviderProps extends BaseOAuthProviderProps {
  /**
   * The oAuth Client ID.
   */
  readonly clientId: string;

  /**
   * The oAuth Client Secret.
   *
   * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
   * > here, instead preferring a password parameter you can still do that but
   * > you will have to cast the string. This is hard on purpose, you should
   * > always prefer `credentialsJSON` over a parameter with a password spec.
   */
  readonly secret: `credentialsJSON:${string}`;

  /**
   * If using Github Enterprise, provide your servers URL.
   *
   * Defaults to: `https://github.com`.
   */
  serverUrl?: string;
}

/**
 * Connect TeamCity to https://github.com or a Github Enterprise server.
 *
 * see: https://www.jetbrains.com/help/teamcity/integrating-teamcity-with-vcs-hosting-services.html#Connecting+to+GitHub
 */
export class GithubOAuthProvider
  extends BaseOAuthProvider<GithubOAuthProviderProps> {
  constructor(scope: Project, props: GithubOAuthProviderProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml(this.props.serverUrl ? "GHE" : "GitHub", (x) => {
      x.Node("param", {
        name: "gitHubUrl",
        value: this.props.serverUrl ?? "https://github.com/",
      });

      x.Node("param", {
        name: "clientId",
        value: this.props.clientId,
      });

      x.Node("param", {
        name: "secure:clientSecret",
        value: this.props.secret,
      });

      // NOTE: This parameter does not surface in the UI anywhere
      // & only appears for the github.com provider.
      if (typeof this.props.serverUrl === "undefined") {
        x.Node("param", {
          name: "defaultTokenScope",
          value: "public_repo,repo,repo:status,write:repo_hook",
        });
      }
    });
  }
}

declare module "../../project.ts" {
  interface Project {
    /**
     * Adds a new GithubOAuthProvider to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.Github({ });
     * });
     * ```
     */
    Github(
      props: GithubOAuthProviderProps,
    ): GithubOAuthProvider;
  }
}

Project.prototype.Github = function (
  this: Project,
  props: GithubOAuthProviderProps,
) {
  return new GithubOAuthProvider(this, props);
};
