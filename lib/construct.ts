// deno-lint-ignore-file no-explicit-any ban-types
import { XmlDocument, XmlElement } from "./xml.ts";

/**
 * The basic structure for our custom DSL.
 *
 * This is an abstract class, you need to extend it.
 * see: <https://github.com/brad-jones/teamcity-ts/blob/master/docs/extending.md>
 */
export abstract class Construct<
  TProps extends Record<string, unknown>,
  TParent extends Construct<Record<string, unknown>, any> | null = null,
> {
  /** Each construct will contain a list of properties, the config for TeamCity. */
  readonly props: TProps;

  /** The root construct will not have a parent & will be null. */
  protected readonly scope: TParent | null;

  /** Recurse up the tree and return the root construct of the DSL. */
  protected get _rootNode(): Construct<any, any> {
    if (this.scope === null) return this;
    return this.scope._rootNode;
  }

  /** A collection of documents to inject into the root construct. */
  protected readonly _xmlDocs: Record<string, XmlDocument> = {};

  /** Allows child constructs to inject new documents into the root construct. */
  protected _addXmlDoc(path: string, doc: XmlDocument) {
    if (typeof this._rootNode._xmlDocs[path] === "undefined") {
      this._rootNode._xmlDocs[path] = doc;
    }
  }

  /** A collection of xml builders to execute against the current construct. */
  protected readonly _xmlBuilders: Map<
    symbol | Function,
    (x: XmlElement) => void
  > = new Map();

  /** Allows child constructs to add new xml into the current construct. */
  protected _addXmlBuilder(
    sym: symbol | Function,
    builder: (x: XmlElement) => void,
  ) {
    if (!this._xmlBuilders.has(sym)) {
      this._xmlBuilders.set(sym, builder);
    }
  }

  constructor(
    scope: TParent | null,
    props: TProps,
    builder?: (_: any) => void,
  ) {
    this.scope = scope;
    this.props = props;
    if (typeof builder !== "undefined") {
      builder(this);
    }
  }

  /** Serializes the DSL into TeamCity XML documents. */
  abstract toXml(): Record<string, XmlDocument> | XmlDocument | XmlElement;

  /** Helper for pushing a new element on to an array that may not yet exist */
  protected static push<T>(scope: T, key: keyof T, value: unknown) {
    if (!Array.isArray(scope[key])) (scope as any)[key as string] = [];
    (scope as any)[key].push(value);
  }
}
