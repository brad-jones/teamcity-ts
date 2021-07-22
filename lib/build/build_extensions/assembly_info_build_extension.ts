import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface AssemblyInfoBuildExtensionProps
  extends BaseBuildExtensionProps {
  /**
   * Specify assembly version format to update `AssemblyVersion` attribute.
   *
   * Defaults to `%system.build.number%`.
   */
  versionFormat?: string;

  /**
   * Specify assembly file version format to update `AssemblyFileVersion` attribute.
   * Leave blank to use same version as specified in assembly version.
   */
  fileVersionFormat?: string;

  /**
   * Specify assembly informational version format to update `AssemblyInformationalVersion` attribute.
   * Leave blank to leave attribute unchanged.
   */
  infoVersionFormat?: string;

  /**
   * When checked, AssemblyInfoPatcher will attempt to patch GlobalAssemblyInfo files.
   *
   * Defaults to `false`.
   */
  patchGlobalAssemblyInfo?: boolean;
}

/**
 * The AssemblyInfo Patcher build feature allows setting a build number to an
 * assembly automatically, without having to patch the `AssemblyInfo.cs` files
 * manually.
 *
 * When adding this build feature, you only need to specify the version format.
 *
 * You can use TeamCity parameter references.
 *
 * see: https://www.jetbrains.com/help/teamcity/assemblyinfo-patcher.html
 */
export class AssemblyInfoBuildExtension
  extends BaseBuildExtension<AssemblyInfoBuildExtensionProps> {
  constructor(scope: Build, props: AssemblyInfoBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("JetBrains.AssemblyInfo", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", {
          name: "assembly-format",
          value: this.props.versionFormat ?? "%system.build.number%",
        });

        if (typeof this.props.fileVersionFormat !== "undefined") {
          x.Node("param", {
            name: "file-format",
            value: this.props.fileVersionFormat,
          });
        }

        if (typeof this.props.infoVersionFormat !== "undefined") {
          x.Node("param", {
            name: "info-format",
            value: this.props.infoVersionFormat,
          });
        }

        x.Node("param", {
          name: "patch-global-assembly-info",
          value: (this.props.patchGlobalAssemblyInfo ?? false)
            ? "true"
            : "false",
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new AssemblyInfoBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.AssemblyInfoExtension({ ... });
     *  });
     * });
     * ```
     */
    AssemblyInfoExtension(
      props: AssemblyInfoBuildExtensionProps,
    ): AssemblyInfoBuildExtension;
  }
}

Build.prototype.AssemblyInfoExtension = function (
  this: Build,
  props: AssemblyInfoBuildExtensionProps,
) {
  return new AssemblyInfoBuildExtension(this, props);
};
