import { Project } from "../project.ts";
import { XmlElement } from "../../xml.ts";
import { Construct } from "../../construct.ts";

export interface BaseProjectExtensionProps extends Record<string, unknown> {
  /**
   * This id is used as an attribute on the extension xml node.
   *
   * eg: `<extension id="foo">`
   *
   * It is not something you have access to in UI and
   * normally TeamCity will generate this value.
   *
   * eg: `PROJECT_EXT_1`, `PROJECT_EXT_2`, `PROJECT_EXT_3`, etc...
   *
   * TODO: Maybe we can generate it too?
   */
  readonly id: string;
}

export abstract class BaseProjectExtension<
  TProps extends BaseProjectExtensionProps,
> extends Construct<TProps, Project> {
  constructor(scope: Project, props: TProps) {
    super(scope, props);
    Construct.push(scope, "extensions", this);
    scope["_addXmlBuilder"](
      BaseProjectExtension,
      (x: XmlElement) => {
        x.Node("project-extensions", (x) => {
          for (const extension of scope.extensions ?? []) {
            x.Node(extension.toXml());
          }
        });
      },
    );
  }

  abstract toXml(): XmlElement;
}

declare module "../project.ts" {
  interface Project {
    /** A readonly list of Extensions added to this Project. */
    readonly extensions?: readonly BaseProjectExtension<
      BaseProjectExtensionProps
    >[];
  }
}
