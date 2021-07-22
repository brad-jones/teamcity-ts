import { Construct } from "../../../construct.ts";
import { Project } from "../../project.ts";
import { XmlElement } from "../../../xml.ts";
import { BaseProjectExtensionProps } from "../base_project_extension.ts";

export interface BaseOAuthProviderProps extends BaseProjectExtensionProps {
  /**
   * Provide some name to distinguish this repository from others.
   */
  readonly displayName: string;
}

/**
 * This is another base type, it refers to the Connections page of a Project.
 */
export abstract class BaseOAuthProvider<
  TProps extends BaseOAuthProviderProps,
> extends Construct<TProps, Project> {
  constructor(scope: Project, props: TProps) {
    super(scope, props);
  }

  protected _baseToXml(
    providerType: string,
    builder: (x: XmlElement) => void,
  ): XmlElement {
    return new XmlElement(
      "extension",
      { id: this.props.id, type: "OAuthProvider" },
      (x) => {
        x.Node("param", {
          name: "providerType",
          value: providerType,
        });

        x.Node("param", {
          name: "name",
          value: this.props.displayName,
        });

        builder(x);
      },
    );
  }

  abstract toXml(): XmlElement;
}
