import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildTrigger,
  BaseBuildTriggerProps,
} from "./base_build_trigger.ts";

export interface MavenArtifactBuildTriggerProps extends BaseBuildTriggerProps {
  /**
   * Specify an identifier of a group the desired Maven artifact belongs to.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-maven-triggers.html#Maven+Artifact+Dependency+Trigger
   */
  groupId: string;

  /**
   * Specify the artifact's identifier.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-maven-triggers.html#Maven+Artifact+Dependency+Trigger
   */
  artifactId: string;

  /**
   * Specify a version or version range of the artifact.
   *
   * The version range syntax is described here:
   * https://www.jetbrains.com/help/teamcity/configuring-maven-triggers.html#Version+Ranges
   *
   * > HINT: SNAPSHOT versions can also be used.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-maven-triggers.html#Maven+Artifact+Dependency+Trigger
   */
  version: string;

  /**
   * Define explicitly the type of the specified artifact.
   *
   * Defaults to `jar`.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-maven-triggers.html#Maven+Artifact+Dependency+Trigger
   */
  artifactType?: string;

  /**
   * (Optional) Specify the classifier of an artifact.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-maven-triggers.html#Maven+Artifact+Dependency+Trigger
   */
  classifier?: string;

  /**
   * Specify a URL to the Maven repository. Note that this parameter is optional.
   *
   * If the URL is not specified, then:
   *
   *  - For a Maven project, the repository URL is determined from the POM and
   *    the server-side Maven Settings.
   *
   *  - For a non-Maven project, the repository URL is determined from the
   *    server-side Maven Settings only.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-maven-triggers.html#Maven+Artifact+Dependency+Trigger
   */
  repoUrl?: string;

  /**
   * Allows using authorization from the effective Maven settings.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-maven-triggers.html#Advanced+Options
   */
  repoId?: string;

  /**
   * Allows selecting effective settings. The same as User Settings of the Maven runner.
   *
   * > HINT: If left undefined the standard Maven settings file location is used.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-maven-triggers.html#Advanced+Options
   */
  userSettingsPath?: string;

  /**
   * Select this option to trigger a build only after the build that produces
   * artifacts used here is finished.
   *
   * Defaults to `false`.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-maven-triggers.html#Maven+Artifact+Dependency+Trigger
   */
  skipIfRunning?: boolean;
}

/**
 * Maven artifact dependency trigger adds build to the queue when there is a
 * real modification of the dependency content which is detected by the
 * checksum change.
 *
 * see: https://www.jetbrains.com/help/teamcity/configuring-maven-triggers.html#Maven+Artifact+Dependency+Trigger
 */
export class MavenArtifactBuildTrigger
  extends BaseBuildTrigger<MavenArtifactBuildTriggerProps> {
  constructor(scope: Build, props: MavenArtifactBuildTriggerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("mavenArtifactDependencyTrigger", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", { name: "artifactId", value: this.props.artifactId });

        if (typeof this.props.classifier !== "undefined") {
          x.Node("param", { name: "classifier", value: this.props.classifier });
        }

        x.Node("param", { name: "groupId", value: this.props.groupId });

        if (typeof this.props.repoId !== "undefined") {
          x.Node("param", { name: "repoId", value: this.props.repoId });
        }

        if (typeof this.props.repoUrl !== "undefined") {
          x.Node("param", { name: "repoUrl", value: this.props.repoUrl });
        }

        x.Node("param", {
          name: "skipIfRunning",
          value: (this.props.skipIfRunning ?? false) ? "true" : "false",
        });

        x.Node("param", {
          name: "type",
          value: this.props.artifactType ?? "jar",
        });

        if (typeof this.props.userSettingsPath !== "undefined") {
          x.Node("param", {
            name: "userSettingsPath",
            value: this.props.userSettingsPath,
          });
          x.Node("param", {
            name: "userSettingsSelection",
            value: "userSettingsSelection:byPath",
          });
        }

        x.Node("param", { name: "version", value: this.props.version });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new MavenArtifactBuildTrigger to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.MavenArtifactTrigger({ ... });
     *  });
     * });
     * ```
     */
    MavenArtifactTrigger(
      props: MavenArtifactBuildTriggerProps,
    ): MavenArtifactBuildTrigger;
  }
}

Build.prototype.MavenArtifactTrigger = function (
  this: Build,
  props: MavenArtifactBuildTriggerProps,
) {
  return new MavenArtifactBuildTrigger(this, props);
};
