import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseOAuthProvider,
  BaseOAuthProviderProps,
} from "./base_oauth_provider.ts";

export interface AmazonDockerOAuthProviderProps extends BaseOAuthProviderProps {
  /**
   * Registry Id / AWS Account Id
   */
  readonly registryID: string;

  /**
   * The AWS Region identifier for where the ECR registry resides.
   */
  readonly region: string;

  /**
   * The `AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY` to use otherwise the
   * default AWS Credential Provider Chain is used.
   */
  auth?: {
    accessKeyId: string;
    secretAccessKey: `credentialsJSON:${string}`;
  };

  /**
   * An IAM role to assume, using AWS STS temporary keys.
   *
   * If not supplied then the provided `AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY`
   * key pair or the default AWS Credential Provider Chain will be used directly.
   */
  role?: {
    arn: string;

    /**
     * External ID is strongly recommended to be used in role trust relationship condition.
     *
     * see: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-user_externalid.html
     */
    externalID?: string;
  };
}

/**
 * Connect TeamCity to an AWS ECR docker registry to simplify docker operations.
 */
export class AmazonDockerOAuthProvider
  extends BaseOAuthProvider<AmazonDockerOAuthProviderProps> {
  constructor(scope: Project, props: AmazonDockerOAuthProviderProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("AmazonDocker", (x) => {
      x.Node("param", {
        name: "aws.region.name",
        value: this.props.region,
      });

      x.Node("param", {
        name: "registryId",
        value: this.props.registryID,
      });

      x.Node("param", {
        name: "aws.use.default.credential.provider.chain",
        value: this.props.auth ? "false" : "true",
      });

      if (typeof this.props.auth !== "undefined") {
        x.Node("param", {
          name: "aws.access.key.id",
          value: this.props.auth.accessKeyId,
        });
        x.Node("param", {
          name: "secure:aws.secret.access.key",
          value: this.props.auth.secretAccessKey,
        });
      }

      x.Node("param", {
        name: "aws.credentials.type",
        value: this.props.role ? "aws.temp.credentials" : "aws.access.keys",
      });

      if (typeof this.props.role !== "undefined") {
        x.Node("param", {
          name: "aws.iam.role.arn",
          value: this.props.role.arn,
        });

        if (typeof this.props.role.externalID !== "undefined") {
          x.Node("param", {
            name: "aws.external.id",
            value: this.props.role.externalID,
          });
        }
      }
    });
  }
}

declare module "../../project.ts" {
  interface Project {
    /**
     * Adds a new AmazonDockerOAuthProvider to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.AmazonDocker({ });
     * });
     * ```
     */
    AmazonDocker(
      props: AmazonDockerOAuthProviderProps,
    ): AmazonDockerOAuthProvider;
  }
}

Project.prototype.AmazonDocker = function (
  this: Project,
  props: AmazonDockerOAuthProviderProps,
) {
  return new AmazonDockerOAuthProvider(this, props);
};
