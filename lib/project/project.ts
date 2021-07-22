import { uuid } from "../../deps.ts";
import { XmlDocument } from "../xml.ts";
import { Construct } from "../construct.ts";

export interface ProjectProps extends Record<string, unknown> {
  /**
   * This refers to the parent folder of the generated XML file stored in the
   * .teamcity folder of your repo & ultimately the server's Data Directory.
   * see: https://www.jetbrains.com/help/teamcity/teamcity-data-directory.html
   *
   * For example an id of `Foo_Bar_Baz` results in the file
   * `./.teamcity/Foo_Bar_Baz/project-config.xml` being generated.
   *
   * This id is also used as a reference in many places
   * throughout the rest of this schema & for URLs, etc...
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/identifier.html
   */
  readonly id: string;

  /**
   * A human friendly name for the project.
   *
   * Defaults to `this.id`.
   */
  name?: string;

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
   *
   * TODO: How are we going to handle updates to existing pipelines,
   * re-generating UUIDs every time seems bad. Maybe we just drop them
   * altogether if TeamCity works without them?
   */
  uuid?: string;

  /** An optional human friendly description of the project. */
  description?: string;

  /** The parent project that this project is a child of (or it's ID). */
  parentProject?: Project | string;
}

/**
 * A project is the top level of this schema, start by creating a Project object.
 *
 * see: https://www.jetbrains.com/help/teamcity/2020.2/creating-and-editing-projects.html
 */
export class Project extends Construct<ProjectProps> {
  /**
   * Creates a new TeamCity Project, this it the entry point into the DSL.
   *
   * ```ts
   * new Project({id: "MyPipeline"}, (p) => {
   *  ...
   * });
   * ```
   */
  constructor(props: ProjectProps, builder?: (p: Project) => void) {
    super(null, props, builder);
  }

  /**
   * Sub projects can be used to group build configurations and define projects
   * hierarchy within a single project.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/project.html#Project+Hierarchy
   */
  readonly subProjects?: readonly Project[];

  /**
   * Adds a new sub project to the current project.
   *
   * ```ts
   * new Project({id: "MyPipeline"}, (p) => {
   *  p.SubProject({id: "AnotherPipeline"}, (p) => {
   *    ...
   *  });
   * });
   * ```
   */
  SubProject(props: ProjectProps, builder?: (p: Project) => void): Project {
    props.parentProject = this;
    const p = new Project(props, builder);
    Construct.push(this, "subProjects", p);
    return p;
  }

  toXml(): Record<string, XmlDocument> {
    const documents: Record<string, XmlDocument> = {};

    // Add any provided docs from child constructs. ie: VcsRoots & Builds
    Object.entries(this._xmlDocs).forEach(([k, v]) => documents[k] = v);

    // Recursively add all sub projects
    (this.subProjects ?? []).forEach((_) =>
      Object.entries(_.toXml()).forEach(([k, v]) => documents[k] = v)
    );

    // Build the base project config document
    documents[`.teamcity/${this.props.id}/project-config.xml`] =
      new XmlDocument(
        (x) => {
          x.Node("project", {
            "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
            "xsi:noNamespaceSchemaLocation":
              "https://www.jetbrains.com/teamcity/schemas/2020.1/project-config.xsd",
            "uuid": this.props.uuid ?? uuid.v4.generate(),
          }, (x) => {
            x.Node("name", this.props.name ?? this.props.id);

            switch (typeof this.props.parentProject) {
              case "object":
                x.Attribute("parent-id", this.props.parentProject.props.id);
                break;
              case "string":
                x.Attribute("parent-id", this.props.parentProject);
                break;
            }

            if (typeof this.props.description === "string") {
              x.Node("description", this.props.description);
            }

            // Allow other child constructs to contribute to this document
            this._xmlBuilders.forEach((_) => _(x));
          });
        },
      );

    return documents;
  }
}
