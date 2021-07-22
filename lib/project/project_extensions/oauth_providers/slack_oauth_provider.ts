import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BaseOAuthProvider,
  BaseOAuthProviderProps,
} from "./base_oauth_provider.ts";

export interface SlackOAuthProviderProps extends BaseOAuthProviderProps {
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
  readonly clientSecret: `credentialsJSON:${string}`;

  /**
   * The bot user token.
   *
   * see: https://api.slack.com/docs/token-types#bot
   *
   * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
   * > here, instead preferring a password parameter you can still do that but
   * > you will have to cast the string. This is hard on purpose, you should
   * > always prefer `credentialsJSON` over a parameter with a password spec.
   */
  readonly botToken: `credentialsJSON:${string}`;
}

/**
 * This is used by the "Slack Notifier".
 *
 * see: https://www.jetbrains.com/help/teamcity/notifications.html#Configuring+Slack+Connection
 */
export class SlackOAuthProvider
  extends BaseOAuthProvider<SlackOAuthProviderProps> {
  constructor(scope: Project, props: SlackOAuthProviderProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("slackConnection", (x) => {
      x.Node("param", { name: "clientId", value: this.props.clientId });
      x.Node("param", { name: "secure:token", value: this.props.botToken });
      x.Node("param", {
        name: "secure:clientSecret",
        value: this.props.clientSecret,
      });
    });
  }
}

declare module "../../project.ts" {
  interface Project {
    /**
     * Adds a new SlackOAuthProvider to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.Slack({ });
     * });
     * ```
     */
    Slack(
      props: SlackOAuthProviderProps,
    ): SlackOAuthProvider;
  }
}

Project.prototype.Slack = function (
  this: Project,
  props: SlackOAuthProviderProps,
) {
  return new SlackOAuthProvider(this, props);
};
