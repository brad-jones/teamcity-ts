import { AllXOR } from "../../types.ts";
import { XmlElement } from "../../xml.ts";
import { Project } from "../project.ts";
import {
  BaseProjectExtension,
  BaseProjectExtensionProps,
} from "./base_project_extension.ts";

export type SharedResourceProjectExtensionProps =
  & BaseProjectExtensionProps
  & {
    /**
     * The name of the shared resource to distinguish it from others.
     */
    readonly name: string;

    /**
     * If the resource is enabled or not.
     *
     * Defaults to `true`.
     */
    enabled?: boolean;
  }
  & AllXOR<[
    {
      /**
       * Quota is a number of concurrent read locks that can be acquired on the resource.
       *
       * Write locks are always exclusive, only a single running build with a
       * write lock is allowed.
       *
       * > HINT: Set this to -1 to get an infinite number of read locks.
       *
       * see: https://www.jetbrains.com/help/teamcity/2020.2/shared-resources.html#Locks+for+Resources+with+Quotas
       */
      quota: number;
    },
    {
      /**
       * Or a resource can represent a set of custom values, such as URLs.
       *
       * Resources with custom values support three types of locks:
       *
       * - Locks on any available value: a build that uses the resource will
       *   start if at least one of the values is available. If all values are
       *   being used at the moment, the build will wait in the queue.
       *
       * - Locks on all values: a build will lock all the values of the resource.
       *   No other builds that use this resource will start until the current
       *   one is finished.
       *
       * - Locks on a specific value: only a specific value of the resource will
       *   be passed to the build. If the value is already taken by a running build,
       *   the new build will wait in the queue until the value becomes available.
       *
       * see: https://www.jetbrains.com/help/teamcity/2020.2/shared-resources.html#Locks+for+Resources+with+Custom+Values
       */
      values: string[];
    },
  ]>;

/**
 * The Shared Resources build feature allows limiting concurrently running
 * builds using a shared resource, such as an external (to the CI server)
 * resource, for example, a test database, or a server with a limited number
 * of connections.
 *
 * see: https://www.jetbrains.com/help/teamcity/2020.2/shared-resources.html
 */
export class SharedResourceProjectExtension
  extends BaseProjectExtension<SharedResourceProjectExtensionProps> {
  constructor(scope: Project, props: SharedResourceProjectExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return new XmlElement(
      "extension",
      { id: this.props.id, type: "JetBrains.SharedResources" },
      (x) => {
        x.Node("param", {
          name: "name",
          value: this.props.name,
        });

        x.Node("param", {
          name: "enabled",
          value: (this.props.enabled ?? true) ? "true" : "false",
        });

        x.Node("param", {
          name: "type",
          value: this.props.quota ? "quoted" : "custom",
        });

        if (typeof this.props.quota !== "undefined") {
          x.Node("param", {
            name: "quota",
            value: this.props.quota.toString(),
          });
        }

        if (typeof this.props.values !== "undefined") {
          x.Node(
            "param",
            { name: "values" },
            (x) => x.CDATA(this.props.values!.join("\n")),
          );
        }
      },
    );
  }
}
