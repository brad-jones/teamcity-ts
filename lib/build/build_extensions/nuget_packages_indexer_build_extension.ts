import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface NuGetPackagesIndexerBuildExtensionProps
  extends BaseBuildExtensionProps {
  /**`
   * The fully qualified name of a `ProjectExtensionPackageRepositoryNuget` object.
   *
   * ie: `{ProjectName}/{NugetRepoName}`
   *
   * > HINT: This does not accept an ID! (Or at least I don't think it does)
   */
  feed: string;
}

/**
 * NuGet packages indexer is an internal TeamCity tool that can index NuGet
 * packages and add them to TeamCity remote private feeds, with no need for
 * additional authorization.
 *
 * When the NuGet packages indexer build feature is added to a build configuration,
 * all .nupkg files published as build artifacts will be indexed and added to
 * the selected NuGet feed. Indexing is performed on the agent side.
 *
 * see: https://www.jetbrains.com/help/teamcity/nuget-packages-indexer.html
 */
export class NuGetPackagesIndexerBuildExtension
  extends BaseBuildExtension<NuGetPackagesIndexerBuildExtensionProps> {
  constructor(scope: Build, props: NuGetPackagesIndexerBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("NuGetPackagesIndexer", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", { name: "feed", value: this.props.feed });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new NuGetPackagesIndexerBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.NuGetPackagesIndexerExtension({ ... });
     *  });
     * });
     * ```
     */
    NuGetPackagesIndexerExtension(
      props: NuGetPackagesIndexerBuildExtensionProps,
    ): NuGetPackagesIndexerBuildExtension;
  }
}

Build.prototype.NuGetPackagesIndexerExtension = function (
  this: Build,
  props: NuGetPackagesIndexerBuildExtensionProps,
) {
  return new NuGetPackagesIndexerBuildExtension(this, props);
};
