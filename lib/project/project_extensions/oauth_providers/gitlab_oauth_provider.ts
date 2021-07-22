import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseOAuthProvider,
  BaseOAuthProviderProps,
} from "./base_oauth_provider.ts";

export interface GitlabOAuthProviderProps extends BaseOAuthProviderProps {
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
   * If using Gitlab CE/EE, provide your servers URL.
   *
   * Defaults to: `https://gitlab.com`.
   */
  serverUrl?: string;
}

/**
 * Connect TeamCity to https://gitlab.com or a Gitlab CE/EE server.
 *
 * see: https://www.jetbrains.com/help/teamcity/integrating-teamcity-with-vcs-hosting-services.html#Connecting+to+GitLab
 */
export class GitlabOAuthProvider
  extends BaseOAuthProvider<GitlabOAuthProviderProps> {
  constructor(scope: Project, props: GitlabOAuthProviderProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml(
      this.props.serverUrl ? "GitLabCEorEE" : "GitLabCom",
      (x) => {
        if (typeof this.props.serverUrl !== "undefined") {
          x.Node("param", { name: "gitLabUrl", value: this.props.serverUrl });
        }

        x.Node("param", {
          name: "clientId",
          value: this.props.clientId,
        });

        x.Node("param", {
          name: "secure:clientSecret",
          value: this.props.secret,
        });
      },
    );
  }
}

declare module "../../project.ts" {
  interface Project {
    /**
     * Adds a new GitlabOAuthProvider to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.Gitlab({ });
     * });
     * ```
     */
    Gitlab(
      props: GitlabOAuthProviderProps,
    ): GitlabOAuthProvider;
  }
}

Project.prototype.Gitlab = function (
  this: Project,
  props: GitlabOAuthProviderProps,
) {
  return new GitlabOAuthProvider(this, props);
};
