import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface DockerSupportBuildExtensionProps
  extends BaseBuildExtensionProps {
  /**
   * On server clean-up, delete pushed Docker images from registry.
   *
   * If you have a build configuration which publishes images, you need to
   * remove them at some point. You can select the corresponding option and
   * instruct TeamCity to remove the images published by a certain build when
   * the build itself is cleaned up.
   *
   * It works as follows: when an image is published, TeamCity stores the
   * information about the registry of the images published by the build.
   *
   * When the server clean-up is run and it deletes the build, all the configured
   * connections are searched for the address of this registry, and the images
   * published by the build are cleaned up using the credentials specified in
   * the found connection.
   *
   * Default to `false`.
   *
   * > HINT: This sounds like it's actually going to delete images from a registry,
   * > the location that you pushed the image to. As opposed to deleting the image
   * > on an agent after pushing it to a registry. The latter I caa understand but
   * > the former just seems wrong... yet another WTF moment thanks to TeamCity.
   *
   * see: https://www.jetbrains.com/help/teamcity/docker-support.html#Docker+Images+Clean-up
   */
  cleanupPushed?: boolean;

  /**
   * To enable automatic login of a docker registry add it's ID here.
   *
   * Accepts `ProjectExtensionOAuthProviderDocker` &
   * `ProjectExtensionOAuthProviderAmazonDocker` IDs.
   *
   * see: https://www.jetbrains.com/help/teamcity/docker-support.html#Docker+Registry+Automatic+Login%2FLogout
   */
  registryIds?: string[];
}

/**
 * The Docker Support build feature allows automatically signing in to a
 * Docker registry before the build start.
 *
 * Adding this feature:
 *
 * - enables the Docker events' monitoring: such operations as docker pull
 *   and docker run will be detected by TeamCity;
 *
 * - adds the Docker Info tab to the Build Results page. The tab provides
 *   information on Docker-related operations.
 *
 * The feature also allows:
 *
 * - cleaning up the Docker images;
 *
 * - automatically log in to an authenticated registry before the build and
 *   log out of it after the build.
 *
 * see: https://www.jetbrains.com/help/teamcity/docker-support.html
 */
export class DockerSupportBuildExtension
  extends BaseBuildExtension<DockerSupportBuildExtensionProps> {
  constructor(scope: Build, props: DockerSupportBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("DockerSupport", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", {
          name: "cleanupPushed",
          value: (this.props.cleanupPushed ?? false) ? "true" : "false",
        });

        if (
          Array.isArray(this.props.registryIds) &&
          this.props.registryIds.length > 0
        ) {
          x.Node("param", { name: "loginCheckbox", value: "on" });
          x.Node("param", {
            name: "login2registry",
            value: this.props.registryIds.join(","),
          });
        }
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new DockerSupportBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.DockerSupportExtension({ ... });
     *  });
     * });
     * ```
     */
    DockerSupportExtension(
      props: DockerSupportBuildExtensionProps,
    ): DockerSupportBuildExtension;
  }
}

Build.prototype.DockerSupportExtension = function (
  this: Build,
  props: DockerSupportBuildExtensionProps,
) {
  return new DockerSupportBuildExtension(this, props);
};
