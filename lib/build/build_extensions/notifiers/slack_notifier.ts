import { Build } from "../../build.ts";
import { XmlElement } from "../../../xml.ts";
import { BaseNotifier, BaseNotifierProps } from "./base_notifier.ts";

export interface SlackNotifierProps extends BaseNotifierProps {
  /**
   * The id of a `ProjectExtensionOAuthProviderSlackConnection` object.
   */
  connection: string;

  /**
   * Specify where messages should be sent.
   *
   * Channel IDs should start with the `#` symbol.
   *
   * Bot should be added to the provided channel to be able to send notifications.
   */
  channel: string;

  /**
   * If left undefined only "simple" messages will be sent.
   */
  msgFmt?: {
    /**
     * Adds branch name to the message.
     *
     * Defaults to `false`.
     */
    addBranch?: boolean;

    /**
     * Adds build status text to the message.
     *
     * Defaults to `false`.
     */
    addBuildStatus?: boolean;

    /**
     * Adds a list of changes to the message, up to the given maximum.
     */
    addChanges?: number;
  };
}

/**
 * The Slack Notifier feature relies on a Slack connection that should be
 * preconfigured in the parent project's settings.
 *
 * see: https://www.jetbrains.com/help/teamcity/notifications.html#Slack+Notifier
 */
export class SlackNotifier extends BaseNotifier<SlackNotifierProps> {
  constructor(scope: Build, props: SlackNotifierProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("slack", (x) => {
      x.Node("param", {
        name: "plugin:notificator:jbSlackNotifier:connection",
        value: this.props.connection,
      });
      x.Node("param", {
        name: "plugin:notificator:jbSlackNotifier:channel",
        value: this.props.channel,
      });

      if (typeof this.props.msgFmt === "undefined") {
        x.Node("param", {
          name: "plugin:notificator:jbSlackNotifier:messageFormat",
          value: "simple",
        });
      } else {
        x.Node("param", {
          name: "plugin:notificator:jbSlackNotifier:messageFormat",
          value: "verbose",
        });
        x.Node("param", {
          name: "plugin:notificator:jbSlackNotifier:addBranch",
          value: (this.props.msgFmt.addBranch ?? false) ? "true" : "false",
        });
        x.Node("param", {
          name: "plugin:notificator:jbSlackNotifier:addBuildStatus",
          value: (this.props.msgFmt.addBuildStatus ?? false) ? "true" : "false",
        });

        if (typeof this.props.msgFmt.addChanges === "number") {
          x.Node("param", {
            name: "plugin:notificator:jbSlackNotifier:addChanges",
            value: "true",
          });
          x.Node("param", {
            name: "plugin:notificator:jbSlackNotifier:maximumNumberOfChanges",
            value: this.props.msgFmt.addChanges.toString(),
          });
        }
      }
    });
  }
}

declare module "../../build.ts" {
  interface Build {
    /**
     * Adds a new SlackNotifier to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.SlackNotifier({ ... });
     *  });
     * });
     * ```
     */
    SlackNotifier(props: SlackNotifierProps): SlackNotifier;
  }
}

Build.prototype.SlackNotifier = function (
  this: Build,
  props: SlackNotifierProps,
) {
  return new SlackNotifier(this, props);
};
