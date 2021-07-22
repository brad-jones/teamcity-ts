import { uuid } from "../../deps.ts";
import { Project } from "../project/project.ts";
import { Construct } from "../construct.ts";
import { XmlDocument, XmlElement } from "../xml.ts";

export interface BaseVcsRootProps extends Record<string, unknown> {
  /**
   * This refers to the filename of the generated XML file stored in the
   * .teamcity folder of your repo & ultimately the server's Data Directory.
   * see: https://www.jetbrains.com/help/teamcity/teamcity-data-directory.html
   *
   * For example an id of `Abc_Xyz123` results in the file
   * `./.teamcity/MyProject/vcsRoots/Abc_Xyz123.xml` being generated.
   *
   * This id is also used as a reference in many places
   * throughout the rest of this schema & for URLs, etc...
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/identifier.html
   *
   * > HINT: ID should start with a latin letter and contain only latin letters,
   *         digits and underscores (at most 225 characters).
   */
  readonly id: string;

  /**
   * This value is used as an attribute on the root XML object. It only appears
   * to be used internally by TeamCity. Hence this is optional and will be
   * generated for you if you do not explicitly define a value.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/identifier.html#Universally+Unique+IDs
   *
   * > NOTE: Despite what the docs say, TeamCity does not appear to automatically
   * > populate the UUID field for you but also doesn't seem to mind that it
   * > doesn't exist, go figure...
   */
  uuid?: string;

  /**
   * A human friendly name for the project.
   *
   * Defaults to `this.id`.
   */
  name?: string;
}

/**
 * A VCS root in TeamCity defines a connection to a version control system.
 * It represents a set of parameters (paths to sources, username, password,
 * and other settings) that determine how TeamCity communicates with a VCS
 * to monitor changes and get sources for a build.
 *
 * VCS roots are created in a project and are available to all the build
 * configurations defined in that project or its subprojects. One or more
 * VCS roots can be attached to a build configuration or a template.
 *
 * You can specify portions of the repository to check out and target paths
 * via VCS checkout rules.
 *
 * see: https://www.jetbrains.com/help/teamcity/vcs-root.html
 * also: https://www.jetbrains.com/help/teamcity/2020.2/configuring-vcs-roots.html
 */
export abstract class BaseVcsRoot<TProps extends BaseVcsRootProps>
  extends Construct<TProps, Project> {
  constructor(scope: Project, props: TProps) {
    super(scope, props);
    Construct.push(scope, "vcsRoots", this);
    scope["_addXmlDoc"](
      `.teamcity/${scope.props.id}/vcsRoots/${props.id}.xml`,
      this.toXml(),
    );
  }

  protected _baseToXml(
    type: string,
    builder: (x: XmlElement) => void,
  ): XmlDocument {
    return new XmlDocument((x) => {
      x.Node("vcs-root", {
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xsi:noNamespaceSchemaLocation":
          "https://www.jetbrains.com/teamcity/schemas/2020.1/project-config.xsd",
        "type": type,
        "uuid": this.props.uuid ?? uuid.v4.generate(),
      }, (x) => {
        x.Node("name", this.props.name ?? this.props.id);
        builder(x);
      });
    });
  }

  abstract toXml(): XmlDocument;
}

declare module "../project/project.ts" {
  interface Project {
    /** A readonly list of VcsRoots added to this Project. */
    readonly vcsRoots?: readonly BaseVcsRoot<BaseVcsRootProps>[];
  }
}
