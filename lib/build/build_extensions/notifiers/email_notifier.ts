import { Build } from "../../build.ts";
import { XmlElement } from "../../../xml.ts";
import { BaseNotifier, BaseNotifierProps } from "./base_notifier.ts";

export interface EmailNotifierProps extends BaseNotifierProps {
  /**
   * The email address to send the notifications to.
   */
  to: string;
}

/**
 * see: https://www.jetbrains.com/help/teamcity/notifications.html#Email+Notifier
 */
export class EmailNotifier extends BaseNotifier<EmailNotifierProps> {
  constructor(scope: Build, props: EmailNotifierProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("email", (x) => {
      x.Node("param", { name: "email", value: this.props.to });
    });
  }
}

declare module "../../build.ts" {
  interface Build {
    /**
     * Adds a new EmailNotifier to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.EmailNotifier({ ... });
     *  });
     * });
     * ```
     */
    EmailNotifier(props: EmailNotifierProps): EmailNotifier;
  }
}

Build.prototype.EmailNotifier = function (
  this: Build,
  props: EmailNotifierProps,
) {
  return new EmailNotifier(this, props);
};
