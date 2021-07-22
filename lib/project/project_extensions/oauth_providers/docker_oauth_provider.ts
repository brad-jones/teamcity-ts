import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseOAuthProvider,
  BaseOAuthProviderProps,
} from "./base_oauth_provider.ts";

export interface DockerOAuthProviderProps extends BaseOAuthProviderProps {
  /**
   * The URL to the Docker Registry.
   *
   * Format: `[http(s)://]hostname[:port]`, by default `https://` is used.
   */
  readonly repositoryUrl: string;

  /**
   * The username & password to authenticate against the Docker Registry.
   *
   * Leave blank for anonymous access.
   */
  readonly auth?: {
    /**
     * The Docker Registry username.
     */
    readonly username: string;

    /**
     * The Docker Registry password.
     *
     * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
     * > here, instead preferring a password parameter you can still do that but
     * > you will have to cast the string. This is hard on purpose, you should
     * > always prefer `credentialsJSON` over a parameter with a password spec.
     */
    readonly password: `credentialsJSON:${string}`;
  };
}

/**
 * Connect TeamCity to a Docker Registry.
 *
 * see: https://www.jetbrains.com/help/teamcity/2020.2/configuring-connections-to-docker.html
 */
export class DockerOAuthProvider
  extends BaseOAuthProvider<DockerOAuthProviderProps> {
  constructor(scope: Project, props: DockerOAuthProviderProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("Docker", (x) => {
      x.Node("param", {
        name: "repositoryUrl",
        value: this.props.repositoryUrl,
      });

      if (typeof this.props.auth !== "undefined") {
        x.Node("param", { name: "userName", value: this.props.auth.username });
        x.Node("param", {
          name: "secure:userPass",
          value: this.props.auth.password,
        });
      }
    });
  }
}

declare module "../../project.ts" {
  interface Project {
    /**
     * Adds a new DockerOAuthProvider to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.Docker({ });
     * });
     * ```
     */
    Docker(
      props: DockerOAuthProviderProps,
    ): DockerOAuthProvider;
  }
}

Project.prototype.Docker = function (
  this: Project,
  props: DockerOAuthProviderProps,
) {
  return new DockerOAuthProvider(this, props);
};
