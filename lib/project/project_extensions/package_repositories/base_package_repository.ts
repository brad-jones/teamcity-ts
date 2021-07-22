import { Construct } from "../../../construct.ts";
import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import { BaseProjectExtensionProps } from "../base_project_extension.ts";

export interface BasePackageRepositoryProps extends BaseProjectExtensionProps {
  /**
   * Provide some name to distinguish this repository from others.
   */
  readonly displayName: string;

  /**
   * An optional human friendly description of the repository.
   */
  description?: string;
}

/**
 * This is another base type, it refers to different types of built-in
 * Package Repositories/Feeds that TeamCity can be configured to provide.
 */
export abstract class BasePackageRepository<
  TProps extends BasePackageRepositoryProps,
> extends Construct<TProps, Project> {
  constructor(scope: Project, props: TProps) {
    super(scope, props);
  }

  protected _baseToXml(
    type: "nuget",
    builder: (x: XmlElement) => void,
  ): XmlElement {
    return new XmlElement(
      "extension",
      { id: this.props.id, type: "PackageRepository" },
      (x) => {
        x.Node("param", {
          name: "type",
          value: type,
        });

        x.Node("param", {
          name: "name",
          value: this.props.displayName,
        });

        if (typeof this.props.description !== "undefined") {
          x.Node("param", {
            name: "description",
            value: this.props.description,
          });
        }

        builder(x);
      },
    );
  }

  abstract toXml(): XmlElement;
}
