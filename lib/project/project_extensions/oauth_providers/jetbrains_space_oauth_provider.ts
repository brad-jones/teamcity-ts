import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseOAuthProvider,
  BaseOAuthProviderProps,
} from "./base_oauth_provider.ts";

export interface JetbrainsSpaceOAuthProviderProps
  extends BaseOAuthProviderProps {
  /**
   * Your space server URL.
   */
  readonly serverUrl: string;

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
}

/**
 * Connect TeamCity to https://www.jetbrains.com/space/
 *
 * see: https://www.jetbrains.com/help/space/ci-server-integration.html#configure-your-teamcity-project
 */
export class JetbrainsSpaceOAuthProvider
  extends BaseOAuthProvider<JetbrainsSpaceOAuthProviderProps> {
  constructor(scope: Project, props: JetbrainsSpaceOAuthProviderProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("JetBrains Space", (x) => {
      x.Node("param", { name: "spaceServerUrl", value: this.props.serverUrl });
      x.Node("param", { name: "spaceClientId", value: this.props.clientId });
      x.Node("param", {
        name: "secure:spaceClientSecret",
        value: this.props.secret,
      });
    });
  }
}

declare module "../../project.ts" {
  interface Project {
    /**
     * Adds a new JetbrainsSpaceOAuthProvider to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.JetbrainsSpace({ });
     * });
     * ```
     */
    JetbrainsSpace(
      props: JetbrainsSpaceOAuthProviderProps,
    ): JetbrainsSpaceOAuthProvider;
  }
}

Project.prototype.JetbrainsSpace = function (
  this: Project,
  props: JetbrainsSpaceOAuthProviderProps,
) {
  return new JetbrainsSpaceOAuthProvider(this, props);
};
