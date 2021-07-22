import { uuid } from "../../deps.ts";
import { Project } from "../project/project.ts";
import { XmlDocument } from "../xml.ts";
import { Construct } from "../construct.ts";

export interface BuildProps extends Record<string, unknown> {
  /**
   * This refers to the filename of the generated XML file stored in the
   * .teamcity folder of your repo & ultimately the server's Data Directory.
   * see: https://www.jetbrains.com/help/teamcity/teamcity-data-directory.html
   *
   * For example an id of `Foo_Bar_Baz` results in the file
   * `./.teamcity/MyProject/buildTypes/Foo_Bar_Baz.xml` being generated.
   *
   * This id is also used as a reference in many places
   * throughout the rest of this schema & for URLs, etc...
   *
   * see: https://www.jetbrains.com/help/teamcity/identifier.html
   */
  readonly id: string;

  /**
   * This value is used as an attribute on the root XML object. It only appears
   * to be used internally by TeamCity. Hence this is optional and will be
   * generated for you if you do not explicitly define a value.
   *
   * see: https://www.jetbrains.com/help/teamcity/identifier.html#Universally+Unique+IDs
   *
   * > NOTE: Despite what the docs say, TeamCity does not appear to automatically
   * > populate the UUID field for you but also doesn't seem to mind that it
   * > doesn't exist, go figure...
   */
  uuid?: string;

  /**
   * A human friendly name for the build type.
   *
   * Defaults to `this.id`.
   */
  name?: string;

  /**
   * An optional human friendly description of the built type.
   */
  description?: string;
}

/**
 * A build configuration is a collection of settings used to start a build and
 * group the sequence of the builds in the UI. Examples of build configurations
 * are distribution, integration tests, prepare release distribution,
 * "nightly" build.
 *
 * A build configuration belongs to a project and contains builds.
 *
 * It is recommended to have a separate build configuration for each sequence
 * of builds (that is performing a specified task in a dedicated environment).
 * This allows for proper features functioning, like detection of new problems/
 * failed tests, first failed in/fixed in tests status, automatically removed
 * investigations, and so on.
 *
 * see: https://www.jetbrains.com/help/teamcity/build-configuration.html
 */
export class Build extends Construct<BuildProps, Project> {
  constructor(scope: Project, props: BuildProps, builder?: (p: Build) => void) {
    super(scope, props, builder);
    Construct.push(scope, "builds", this);
    this._addXmlDoc(
      `.teamcity/${scope.props.id}/buildTypes/${props.id}.xml`,
      this.toXml(),
    );
  }

  toXml(): XmlDocument {
    return new XmlDocument((x) => {
      x.Node("build-type", {
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xsi:noNamespaceSchemaLocation":
          "https://www.jetbrains.com/teamcity/schemas/2020.1/project-config.xsd",
        "uuid": this.props.uuid ?? uuid.v4.generate(),
      }, (x) => {
        x.Node("name", this.props.name ?? this.props.id);

        if (typeof this.props.description === "string") {
          x.Node("description", this.props.description);
        }

        x.Node("settings", (x) => {
          this._xmlBuilders.forEach((_) => _(x));
        });
      });
    });
  }
}

declare module "../project/project.ts" {
  interface Project {
    /**
     * A readonly list of Builds added to this Project.
     */
    readonly builds?: readonly Build[];

    /**
     * Adds a new Build Configuration to a Project.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    ...
     *  });
     * });
     * ```
     */
    Build(props: BuildProps, builder?: (p: Build) => void): Build;
  }
}

Project.prototype.Build = function (
  this: Project,
  props: BuildProps,
  builder?: (p: Build) => void,
) {
  return new Build(this, props, builder);
};
