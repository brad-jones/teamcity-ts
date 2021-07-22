import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface AgentFreeSpaceBuildExtensionProps
  extends BaseBuildExtensionProps {
  /**
   * You can specify a custom free disk space value here (in bytes or using one
   * of the kb, mb, gb or tb suffixes).
   */
  requiredSpace?: string;

  /**
   * Fail build if sufficient disk space cannot be freed.
   *
   * Defaults to `true`.
   */
  failBuild?: boolean;
}

/**
 * The Free disk space build feature allows ensuring certain free disk space
 * on the agent before the build by deleting files managed by the TeamCity
 * agent (other build's checkout directories and various caches).
 *
 * When the feature is not configured, the default free space for a
 * build is 3 GB.
 *
 * see: https://www.jetbrains.com/help/teamcity/free-disk-space.html
 */
export class AgentFreeSpaceBuildExtension
  extends BaseBuildExtension<AgentFreeSpaceBuildExtensionProps> {
  constructor(scope: Build, props: AgentFreeSpaceBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("jetbrains.agent.free.space", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", {
          name: "free-space-work",
          value: this.props.requiredSpace ?? "3gb",
        });
        x.Node("param", {
          name: "free-space-fail-start",
          value: (this.props.failBuild ?? true) ? "true" : "false",
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new AgentFreeSpaceBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.AgentFreeSpaceExtension({ ... });
     *  });
     * });
     * ```
     */
    AgentFreeSpaceExtension(
      props: AgentFreeSpaceBuildExtensionProps,
    ): AgentFreeSpaceBuildExtension;
  }
}

Build.prototype.AgentFreeSpaceExtension = function (
  this: Build,
  props: AgentFreeSpaceBuildExtensionProps,
) {
  return new AgentFreeSpaceBuildExtension(this, props);
};
