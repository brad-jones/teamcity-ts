import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import { Construct } from "../../construct.ts";

export interface BaseBuildExtensionProps extends Record<string, unknown> {
  /**
   * This ID is not exposed in UI and is just an incrementing number.
   *
   * eg: `BUILD_EXT_1`, `BUILD_EXT_2`, `BUILD_EXT_3`, etc...
   *
   * So if not set it will be set for you.
   */
  readonly id: string;
}

export abstract class BaseBuildExtension<
  TProps extends BaseBuildExtensionProps,
> extends Construct<TProps, Build> {
  constructor(scope: Build, props: TProps) {
    super(scope, props);
    Construct.push(scope, "extensions", this);
    scope["_addXmlBuilder"](
      BaseBuildExtension,
      (x: XmlElement) => {
        x.Node("build-extensions", (x) => {
          for (const extension of scope.extensions ?? []) {
            x.Node(extension.toXml());
          }
        });
      },
    );
  }

  protected _baseToXml(
    type: string,
    builder: (x: XmlElement) => void,
  ): XmlElement {
    return new XmlElement(
      "extension",
      { id: this.props.id, type: type },
      (x) => {
        builder(x);
      },
    );
  }

  abstract toXml(): XmlElement;
}

declare module "../build.ts" {
  interface Build {
    /** A readonly list of extensions added to this Build. */
    readonly extensions?: readonly BaseBuildExtension<
      BaseBuildExtensionProps
    >[];
  }
}
