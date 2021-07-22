import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import {
  BasePackageRepository,
  BasePackageRepositoryProps,
} from "./base_package_repository.ts";

export interface NugetPackageRepositoryProps
  extends BasePackageRepositoryProps {
  /**
   * NuGet packages indexer is an internal TeamCity tool that can index NuGet
   * packages and add them to TeamCity remote private feeds, with no need for
   * additional authorization.
   *
   * When the NuGet packages indexer build feature is added to a build configuration,
   * all `.nupkg` files published as build artifacts will be indexed and added to
   * the selected NuGet feed. Indexing is performed on the agent side.
   *
   * Defaults to: `false`.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/nuget-packages-indexer.html
   */
  indexPackages?: boolean;
}

/**
 * If you want to publish your NuGet packages to a limited audience,
 * for example, to use them internally, you can use TeamCity as a NuGet feed.
 * You can configure multiple NuGet feeds for a TeamCity project.
 *
 * The built-in TeamCity NuGet feed supports API v1/v2/v3.
 *
 * see: https://www.jetbrains.com/help/teamcity/2020.2/using-teamcity-as-nuget-feed.html
 */
export class NugetPackageRepository
  extends BasePackageRepository<NugetPackageRepositoryProps> {
  constructor(scope: Project, props: NugetPackageRepositoryProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("nuget", (x) => {
      x.Node("param", {
        name: "description",
        value: (this.props.indexPackages ?? false) ? "true" : "false",
      });
    });
  }
}

declare module "../../project.ts" {
  interface Project {
    /**
     * Adds a new NugetPackageRepository to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.NugetPackageRepository({ });
     * });
     * ```
     */
    NugetPackageRepository(
      props: NugetPackageRepositoryProps,
    ): NugetPackageRepository;
  }
}

Project.prototype.NugetPackageRepository = function (
  this: Project,
  props: NugetPackageRepositoryProps,
) {
  return new NugetPackageRepository(this, props);
};
