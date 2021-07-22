import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface SwabraBuildExtensionProps extends BaseBuildExtensionProps {
  /**
   * Select whether you want to perform build files clean-up, and when it will be performed.
   *
   * Defaults to `BEFORE_NEXT_BUILD`.
   *
   * see: https://www.jetbrains.com/help/teamcity/build-files-cleaner-swabra.html#Configuring+Swabra+Options
   */
  filesCleanUp?: "DO_NOT_CLEANUP" | "BEFORE_NEXT_BUILD" | "AFTER_BUILD_FINISH";

  /**
   * If enabled this will ensure that the checkout directory corresponds to the
   * sources in the repository at the build start.
   *
   * If Swabra detects any modified or deleted files in the checkout directory
   * before the build start, it will enforce clean checkout.
   *
   * The build will fail if Swabra cannot delete some files created during the
   * previous build.
   *
   * If this option is disabled, you will only get warnings about modified and
   * deleted files.
   *
   * Defaults to `false`.
   *
   * see: https://www.jetbrains.com/help/teamcity/build-files-cleaner-swabra.html#Configuring+Swabra+Options
   */
  cleanCheckout?: boolean;

  /**
   * Select whether you want Swabra to inspect the checkout directory for processes
   * locking files in this directory, and what to do with such processes.
   *
   * Defaults to `DO_NOT_DETECT`.
   *
   * > HINT: `handle.exe` is required on agents for locking processes detection.
   *
   * see: https://www.jetbrains.com/help/teamcity/build-files-cleaner-swabra.html#Configuring+Swabra+Options
   */
  lockingProcesses?: "DO_NOT_DETECT" | "REPORT" | "KILL";

  /**
   * Specify a set of `+-:path` rules to define which files and folders are to
   * be involved in the files collection process (by default and until explicitly
   * excluded, the entire checkout directory is monitored).
   *
   * The path can be relative (based on the build's checkout directory) or absolute
   * and can include Ant-like wildcards. If no `+:` or `-:` prefix is specified,
   * a rule as treated as "include".
   *
   * - Rules on any path must come in the order from more general to more concrete.
   * - The top level path must always point to a directory.
   * - Specifying a directory affects its entire content and subdirectories.
   * - Note also that Swabra is case-sensitive.
   *
   * Examples:
   * - `-:{{star}}/dir/*`: excludes all dir folders and their content.
   *
   * - `-:some/dir, +:some/dir/inner` excludes some/dir folder and all its
   *   content except for the inner subfolder and its content.
   *
   * - `+:./*file.txt` includes only the specified file in the build checkout
   *   directory into monitoring.
   *
   * - `-:file.txt` excludes the specified file in the build checkout directory
   *   from monitoring.
   *
   * > HINT: After removing some exclude rules, it is advisable to run a clean checkout.
   */
  pathsToMonitor?: string[];

  /**
   * Check this option to enable detailed logging to build log.
   *
   * Defaults to `false`.
   */
  verboseOutput?: boolean;
}

/**
 * Swabra is a bundled plugin allowing you to clean files created during the build.
 *
 * The plugin remembers the state of the file tree after the sources checkout
 * and deletes all the newly added files at the end of the build or at the next
 * build start depending on the settings.
 *
 * Swabra also detects files modified or deleted during the build and reports
 * them to the build log (however, such files are not restored by the plugin).
 *
 * The plugin can also ensure that by the start of the build there are no files
 * modified or deleted by previous builds and initiate clean checkout if such
 * files are detected.
 *
 * > HINT: Not really needed if you are always building in an immutable
 * >       environment, like a container.
 *
 * see: https://www.jetbrains.com/help/teamcity/build-files-cleaner-swabra.html
 */
export class SwabraBuildExtension
  extends BaseBuildExtension<SwabraBuildExtensionProps> {
  constructor(scope: Build, props: SwabraBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("swabra", (x) => {
      x.Node("parameters", (x) => {
        const filesCleanUp = this.props.filesCleanUp ?? "BEFORE_NEXT_BUILD";
        if (filesCleanUp !== "DO_NOT_CLEANUP") {
          x.Node("param", {
            name: "swabra.enabled",
            value: `swabra.${
              filesCleanUp === "BEFORE_NEXT_BUILD" ? "before" : "after"
            }.build`,
          });
        }

        const lockingProcesses = this.props.lockingProcesses ?? "DO_NOT_DETECT";
        if (lockingProcesses !== "DO_NOT_DETECT") {
          x.Node("param", {
            name: "swabra.processes",
            value: lockingProcesses.toLowerCase(),
          });
        }

        if (
          Array.isArray(this.props.pathsToMonitor) &&
          this.props.pathsToMonitor.length > 0
        ) {
          x.Node(
            "param",
            { name: "swabra.rules" },
            (x) => x.CDATA(this.props.pathsToMonitor!.join("\n")),
          );
        }

        x.Node("param", {
          name: "swabra.strict",
          value: (this.props.cleanCheckout ?? false) ? "true" : "false",
        });

        x.Node("param", {
          name: "swabra.verbose",
          value: (this.props.verboseOutput ?? false) ? "true" : "false",
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new SwabraBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.SwabraExtension({ ... });
     *  });
     * });
     * ```
     */
    SwabraExtension(
      props: SwabraBuildExtensionProps,
    ): SwabraBuildExtension;
  }
}

Build.prototype.SwabraExtension = function (
  this: Build,
  props: SwabraBuildExtensionProps,
) {
  return new SwabraBuildExtension(this, props);
};
