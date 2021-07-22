import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import { Construct } from "../../construct.ts";

export interface BaseBuildTriggerProps extends Record<string, unknown> {
  /**
   * This ID is not exposed in UI and is just an incrementing number.
   *
   * eg: `TRIGGER_1`, `TRIGGER_2`, `TRIGGER_3`, etc...
   *
   * So if not set it will be set for you.
   */
  readonly id: string;
}

export abstract class BaseBuildTrigger<
  TProps extends BaseBuildTriggerProps,
> extends Construct<TProps, Build> {
  constructor(scope: Build, props: TProps) {
    super(scope, props);
    Construct.push(scope, "triggers", this);
    scope["_addXmlBuilder"](
      BaseBuildTrigger,
      (x: XmlElement) => {
        x.Node("build-triggers", (x) => {
          for (const trigger of scope.triggers ?? []) {
            x.Node(trigger.toXml());
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
      "build-trigger",
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
    /** A readonly list of Triggers added to this Build. */
    readonly triggers?: readonly BaseBuildTrigger<
      BaseBuildTriggerProps
    >[];
  }
}
