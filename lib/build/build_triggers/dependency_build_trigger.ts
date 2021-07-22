import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildTrigger,
  BaseBuildTriggerProps,
} from "./base_build_trigger.ts";

export interface DependencyBuildTriggerProps extends BaseBuildTriggerProps {
  /**
   * The ID of the BuildType that will fire this trigger when it finishes.
   */
  buildTypeId: string;

  /**
   * Trigger after successful build only.
   *
   * Defaults to `false`.
   */
  afterSuccessfulBuildOnly?: boolean;

  /**
   * In a build configuration with branches, you can use the branch filter to
   * limit the branches in which finished builds will trigger new builds of
   * the current configuration.
   *
   * Defaults to `+:<default>`.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-finish-build-trigger.html#Triggering+Settings
   */
  branchFilter?: string[];
}

/**
 * The finish build trigger starts a build of the current build configuration
 * when a build of the selected build configuration is finished.
 *
 * see: https://www.jetbrains.com/help/teamcity/configuring-finish-build-trigger.html
 */
export class DependencyBuildTrigger
  extends BaseBuildTrigger<DependencyBuildTriggerProps> {
  constructor(scope: Build, props: DependencyBuildTriggerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("buildDependencyTrigger", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", { name: "dependsOn", value: this.props.buildTypeId });

        x.Node("param", {
          name: "afterSuccessfulBuildOnly",
          value: (this.props.afterSuccessfulBuildOnly ?? false)
            ? "true"
            : "false",
        });

        x.Node(
          "param",
          { name: "branchFilter" },
          (x) => x.CDATA((this.props.branchFilter ?? []).join("\n")),
        );
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new DependencyBuildTrigger to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.DependencyTrigger({ ... });
     *  });
     * });
     * ```
     */
    DependencyTrigger(
      props: DependencyBuildTriggerProps,
    ): DependencyBuildTrigger;
  }
}

Build.prototype.DependencyTrigger = function (
  this: Build,
  props: DependencyBuildTriggerProps,
) {
  return new DependencyBuildTrigger(this, props);
};
