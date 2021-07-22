import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseOAuthProvider,
  BaseOAuthProviderProps,
} from "./base_oauth_provider.ts";

export interface TfsOAuthProviderProps extends BaseOAuthProviderProps {
  /**
   * URL format:
   * - Azure DevOps: `https://dev.azure.com/<organization>`
   * - VSTS: `https://<account>.visualstudio.com`
   */
  readonly serverUrl: string;

  /**
   * The oAuth bearer token.
   *
   * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
   * > here, instead preferring a password parameter you can still do that but
   * > you will have to cast the string. This is hard on purpose, you should
   * > always prefer `credentialsJSON` over a parameter with a password spec.
   */
  readonly accessToken: `credentialsJSON:${string}`;
}

/**
 * Connect TeamCity to Azure Devops or VSTS. aka: TFS.
 *
 * see: https://www.jetbrains.com/help/teamcity/integrating-teamcity-with-vcs-hosting-services.html#Connecting+to+Azure+DevOps+Services
 */
export class TfsOAuthProvider extends BaseOAuthProvider<TfsOAuthProviderProps> {
  constructor(scope: Project, props: TfsOAuthProviderProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("tfs", (x) => {
      x.Node("param", { name: "type", value: "token" }); // NOTE: This seemed to be hard coded thing in the XML
      x.Node("param", { name: "serverUrl", value: this.props.serverUrl });
      x.Node("param", {
        name: "secure:accessToken",
        value: this.props.accessToken,
      });
    });
  }
}

declare module "../../project.ts" {
  interface Project {
    /**
     * Adds a new TfsOAuthProvider to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.Tfs({ });
     * });
     * ```
     */
    Tfs(
      props: TfsOAuthProviderProps,
    ): TfsOAuthProvider;
  }
}

Project.prototype.Tfs = function (
  this: Project,
  props: TfsOAuthProviderProps,
) {
  return new TfsOAuthProvider(this, props);
};
