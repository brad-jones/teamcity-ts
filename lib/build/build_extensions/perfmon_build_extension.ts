import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

// deno-lint-ignore no-empty-interface
export interface PerfmonBuildExtensionProps extends BaseBuildExtensionProps {}

/**
 * The Performance Monitor build feature allows you to get the statistics on
 * the CPU, disk, and memory usage during a build run on a build agent.
 *
 * Performance Monitor supports Windows, Linux, macOS, Solaris,
 * and FreeBSD operating systems.
 *
 * > HINT: It requires Perl to be installed on any used OS except Windows.
 *
 * see: https://www.jetbrains.com/help/teamcity/performance-monitor.html
 */
export class PerfmonBuildExtension
  extends BaseBuildExtension<PerfmonBuildExtensionProps> {
  constructor(scope: Build, props: PerfmonBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("perfmon", (x) => {
      x.Node("parameters");
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new PerfmonBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.PerfmonExtension({ ... });
     *  });
     * });
     * ```
     */
    PerfmonExtension(
      props: PerfmonBuildExtensionProps,
    ): PerfmonBuildExtension;
  }
}

Build.prototype.PerfmonExtension = function (
  this: Build,
  props: PerfmonBuildExtensionProps,
) {
  return new PerfmonBuildExtension(this, props);
};
