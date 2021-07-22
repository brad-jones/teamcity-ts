import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildTrigger,
  BaseBuildTriggerProps,
} from "./base_build_trigger.ts";

export interface NugetBuildTriggerProps extends BaseBuildTriggerProps {
  /**
   * The path to the nuget executable.
   *
   * > HINT: If left undefined then we assume it will be found on the `$PATH`.
   */
  nugetExe?: string;

  /**
   * Specify the NuGet packages feed URL to monitor packages changes.
   *
   * Defaults to `https://api.nuget.org/v3/index.json`.
   */
  source?: string;

  /**
   * Specify username to access NuGet feed, leave undefined if no authentication
   * is required.
   */
  username?: string;

  /**
   * Specify password to access NuGet feed, leave undefined if no authentication
   * is required.
   */
  password?: string;

  /**
   * Specify package Id to check for updates.
   */
  packageId: string;

  /**
   * Optionally, you can specify package version range to check for.
   * If not specified, TeamCity will check for latest version.
   *
   * > HINT: Supported only for TeamCity server is running under Windows with
   * >       Microsoft .NET Framework 4.0/4.5 installed.
   *
   * TODO: As per above note, I have not been able to model this into the XML
   *       layer as I have been running TeamCity with docker.
   *
   * see: https://docs.microsoft.com/en-us/nuget/concepts/package-versioning
   */
  //packageVersionSpec?: string;

  /**
   * Trigger build if pre-release package version is detected.
   *
   * Defaults to `false`.
   */
  triggerOnPreRelease?: boolean;
}

/**
 * The NuGet dependency trigger allows starting a new build if a NuGet
 * packages update is detected in the NuGet repository.
 *
 * > HINT: Currently, the NuGet dependency trigger supports only API versions
 * >       1 and 2 due to specifics of the Nuget.CommandLine tool.
 *
 * see: https://www.jetbrains.com/help/teamcity/nuget-dependency-trigger.html
 */
export class NugetBuildTrigger
  extends BaseBuildTrigger<NugetBuildTriggerProps> {
  constructor(scope: Build, props: NugetBuildTriggerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("nuget.simple", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", { name: "nuget.package", value: this.props.packageId });

        if (typeof this.props.nugetExe !== "undefined") {
          x.Node("param", { name: "nuget.exe", value: this.props.nugetExe });
        }

        x.Node("param", {
          name: "nuget.source",
          value: this.props.source ?? "https://api.nuget.org/v3/index.json",
        });

        if (typeof this.props.username !== "undefined") {
          x.Node("param", {
            name: "nuget.username",
            value: this.props.username,
          });
        }

        if (typeof this.props.password !== "undefined") {
          x.Node("param", {
            name: "secure:nuget.password",
            value: this.props.password,
          });
        }

        x.Node("param", {
          name: "nuget.include.prerelease",
          value: (this.props.triggerOnPreRelease ?? false) ? "true" : "false",
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new NugetBuildTrigger to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.NugetTrigger({ ... });
     *  });
     * });
     * ```
     */
    NugetTrigger(
      props: NugetBuildTriggerProps,
    ): NugetBuildTrigger;
  }
}

Build.prototype.NugetTrigger = function (
  this: Build,
  props: NugetBuildTriggerProps,
) {
  return new NugetBuildTrigger(this, props);
};
