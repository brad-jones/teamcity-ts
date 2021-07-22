import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseOAuthProvider,
  BaseOAuthProviderProps,
} from "./base_oauth_provider.ts";

export interface BitbucketCloudOAuthProviderProps
  extends BaseOAuthProviderProps {
  /**
   * The Bitbucket API Key.
   */
  readonly key: string;

  /**
   * The Bitbucket API Secret.
   *
   * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
   * > here, instead preferring a password parameter you can still do that but
   * > you will have to cast the string. This is hard on purpose, you should
   * > always prefer `credentialsJSON` over a parameter with a password spec.
   */
  readonly secret: `credentialsJSON:${string}`;
}

/**
 * Connect TeamCity to https://bitbucket.org
 *
 * see: https://www.jetbrains.com/help/teamcity/integrating-teamcity-with-vcs-hosting-services.html#Connecting+to+Bitbucket+Cloud
 */
export class BitbucketCloudOAuthProvider
  extends BaseOAuthProvider<BitbucketCloudOAuthProviderProps> {
  constructor(scope: Project, props: BitbucketCloudOAuthProviderProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("BitBucketCloud", (x) => {
      x.Node("param", { name: "clientId", value: this.props.key });
      x.Node("param", {
        name: "secure:clientSecret",
        value: this.props.secret,
      });
    });
  }
}

declare module "../../project.ts" {
  interface Project {
    /**
     * Adds a new BitbucketCloudOAuthProvider to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.BitbucketCloud({ });
     * });
     * ```
     */
    BitbucketCloud(
      props: BitbucketCloudOAuthProviderProps,
    ): BitbucketCloudOAuthProvider;
  }
}

Project.prototype.BitbucketCloud = function (
  this: Project,
  props: BitbucketCloudOAuthProviderProps,
) {
  return new BitbucketCloudOAuthProvider(this, props);
};
