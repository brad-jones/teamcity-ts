import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface SharedResourcesBuildExtensionProps
  extends BaseBuildExtensionProps {
  /**
   * The name of a `ProjectExtensionSharedResource` object.
   */
  name: string;

  /**
   * Depending on the resource being locked, the lock type differs.
   *
   * Locks for Resources with Quotas:
   * - `READ` locks: shared (multiple running builds with read locks are allowed).
   * - `WRITE` locks: exclusive (only a single running build with a write lock is allowed).
   *
   * Locks for Resources with Custom Values:
   * - `ANY_VALUE` locks on any available value: a build that uses the resource
   *   will start if at least one of the values is available. If all values are
   *   being used at the moment, the build will wait in the queue.
   *
   * - `ALL_VALUES` locks on all values: a build will lock all the values of the
   *   resource. No other builds that use this resource will start until the
   *   current one is finished.
   *
   * - Locks on a specific value: only a specific value of the resource will be
   *   passed to the build. If the value is already taken by a running build,
   *   the new build will wait in the queue until the value becomes available.
   *
   * TODO: Figure out a type safe way to represent the different types of
   *       locks and resources.
   *
   * see: https://www.jetbrains.com/help/teamcity/shared-resources.html#Locks+for+Resources+with+Quotas
   * also: https://www.jetbrains.com/help/teamcity/shared-resources.html#Locks+for+Resources+with+Custom+Values
   */
  lockType: "READ" | "WRITE" | "ANY_VALUE" | "ALL_VALUES" | {
    specificValue: string;
  };
}

/**
 * The Shared Resources build feature allows limiting concurrently running
 * builds using a shared resource, such as an external (to the CI server)
 * resource, for example, a test database, or a server with a limited number
 * of connections.
 *
 * see: https://www.jetbrains.com/help/teamcity/shared-resources.html
 */
export class SharedResourcesBuildExtension
  extends BaseBuildExtension<SharedResourcesBuildExtensionProps> {
  constructor(scope: Build, props: SharedResourcesBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("JetBrains.SharedResources", (x) => {
      let lockType: string;
      let lockOn = "";
      switch (this.props.lockType) {
        case "READ":
          lockType = "readLock";
          break;
        case "WRITE":
          lockType = "writeLock";
          break;
        case "ANY_VALUE":
          lockType = "readLock";
          break;
        case "ALL_VALUES":
          lockType = "writeLock";
          break;
        default:
          lockType = "writeLock";
          lockOn = ` ${this.props.lockType.specificValue}`;
      }

      x.Node("parameters", (x) => {
        x.Node("param", {
          name: "locks-param",
          value: `${this.props.name} ${lockType}${lockOn}`,
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new SharedResourcesBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.SharedResourcesExtension({ ... });
     *  });
     * });
     * ```
     */
    SharedResourcesExtension(
      props: SharedResourcesBuildExtensionProps,
    ): SharedResourcesBuildExtension;
  }
}

Build.prototype.SharedResourcesExtension = function (
  this: Build,
  props: SharedResourcesBuildExtensionProps,
) {
  return new SharedResourcesBuildExtension(this, props);
};
