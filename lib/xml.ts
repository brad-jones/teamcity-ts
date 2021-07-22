import { xmlFmt } from "../deps.ts";

/**
 * A DSL for constructing an XML document.
 *
 * ```ts
 * new XmlDocument((x) => {
 *  x.Node('users', (x) => {
 *    x.Node('user', {id: 1}, (x) => {
 *      x.Node('first-name', 'Brad');
 *      x.Node('last-name', 'Jones');
 *    });
 *  });
 * });
 * ```
 */
export class XmlDocument {
  /**
   * The root element of the document.
   *
   * This will be added by the first and only call to the Node method
   */
  root?: XmlElement;

  constructor(builder: (doc: XmlDocument) => void) {
    builder(this);
  }

  /**
   * Add the root node to the document.
   *
   * This method can only be called once for a given instance of a XmlDocument
   * as there can only be a single root node.
   */
  Node(element: XmlElement): XmlElement;
  Node(name: string): XmlElement;
  Node(name: string, content: string): XmlElement;
  Node(
    name: string,
    attributes: Record<string, string>,
  ): XmlElement;
  Node(
    name: string,
    attributes: Record<string, string>,
    content: string,
  ): XmlElement;
  Node(
    name: string,
    builder: (parent: XmlElement) => void,
  ): XmlElement;
  Node(
    name: string,
    attributes: Record<string, string>,
    builder: (parent: XmlElement) => void,
  ): XmlElement;
  Node(
    name: string,
    content: string,
    builder: (parent: XmlElement) => void,
  ): XmlElement;
  Node(
    name: string,
    attributes: Record<string, string>,
    content: string,
    builder: (parent: XmlElement) => void,
  ): XmlElement;
  Node(...args: unknown[]): XmlElement {
    if (typeof this.root !== "undefined") {
      throw new Error("An XmlDocument can only have a single root node");
    }

    let node: XmlElement;
    if (args[0] instanceof XmlElement) {
      node = args[0];
    } else {
      const { name, attributes, content, builder } = parseArgs(...args);
      node = new XmlElement(name);
      node.attributes = attributes;
      node.content = content;
      if (builder !== undefined) {
        builder(node);
      }
    }

    node.parent = this;
    this.root = node;
    return node;
  }

  /** Converts the XmlDocument into a Plain Old JavaScript Object. */
  toJSON(): Record<string, unknown> {
    return this.root?.toJSON() ?? {};
  }

  /** Converts the XmlDocument into an actual XML string. */
  toString(fmt = false): string {
    return this.root?.toString(fmt) ?? "";
  }
}

/** This represents a single element or node in an XmlDocument. */
export class XmlElement {
  /** The name of the element */
  name: string;

  /** Optional set of attributes */
  attributes?: Record<string, string>;

  /** Optional inner content */
  content?: string;

  /** The parent element of this element */
  parent?: XmlDocument | XmlElement;

  /** A list of children elements */
  children: XmlElement[] = [];

  constructor(name: string);
  constructor(name: string, content: string);
  constructor(
    name: string,
    attributes: Record<string, string>,
  );
  constructor(
    name: string,
    attributes: Record<string, string>,
    content: string,
  );
  constructor(
    name: string,
    builder: (parent: XmlElement) => void,
  );
  constructor(
    name: string,
    attributes: Record<string, string>,
    builder: (parent: XmlElement) => void,
  );
  constructor(
    name: string,
    content: string,
    builder: (parent: XmlElement) => void,
  );
  constructor(
    name: string,
    attributes: Record<string, string>,
    content: string,
    builder: (parent: XmlElement) => void,
  );
  constructor(...args: unknown[]) {
    const { name, attributes, content, builder } = parseArgs(...args);
    this.name = name;
    this.attributes = attributes;
    this.content = content;
    if (builder !== undefined) {
      builder(this);
    }
  }

  /** Add a new child node to the current element */
  Node(element: XmlElement): XmlElement;
  Node(name: string): XmlElement;
  Node(name: string, content: string): XmlElement;
  Node(
    name: string,
    attributes: Record<string, string>,
  ): XmlElement;
  Node(
    name: string,
    attributes: Record<string, string>,
    content: string,
  ): XmlElement;
  Node(
    name: string,
    builder: (parent: XmlElement) => void,
  ): XmlElement;
  Node(
    name: string,
    attributes: Record<string, string>,
    builder: (parent: XmlElement) => void,
  ): XmlElement;
  Node(
    name: string,
    content: string,
    builder: (parent: XmlElement) => void,
  ): XmlElement;
  Node(
    name: string,
    attributes: Record<string, string>,
    content: string,
    builder: (parent: XmlElement) => void,
  ): XmlElement;
  Node(...args: unknown[]): XmlElement {
    let node: XmlElement;

    if (args[0] instanceof XmlElement) {
      node = args[0];
    } else {
      const { name, attributes, content, builder } = parseArgs(...args);
      node = new XmlElement(name);
      node.attributes = attributes;
      node.content = content;
      if (builder !== undefined) {
        builder(node);
      }
    }

    node.parent = this;
    this.children.push(node);
    return node;
  }

  /** Adds a new attribute to the current node. */
  Attribute(key: string, value: string) {
    if (typeof this.attributes === "undefined") {
      this.attributes = {};
    }
    this.attributes[key] = value;
  }

  /** Adds a comment node */
  Comment(value: string): XmlElement {
    return this.Node("--", value);
  }

  /** Adds a CDATA node */
  CDATA(value: string): XmlElement {
    return this.Node("CDATA", value);
  }

  /** Converts the XmlElement (& it's children) into a Plain Old JavaScript Object. */
  toJSON(): Record<string, unknown> {
    const obj: Record<string, unknown> = {
      name: this.name,
      children: this.children.map((_) => _.toJSON()),
    };

    if (typeof this.attributes !== "undefined") {
      obj["attributes"] = this.attributes;
    }

    if (typeof this.content !== "undefined") {
      obj["content"] = this.content;
    }

    return obj;
  }

  /** Converts the XmlElement (& it's children) into an actual XML string. */
  toString(fmt = false): string {
    const xml: string[] = [];

    // Comments & CDATA get special treatment as they aren't really nodes
    if (this.name === "--") {
      xml.push(`<!-- ${this.content} -->`);
    } else if (this.name === "CDATA") {
      xml.push(`<![CDATA[${this.content}]]>`);
    } else {
      // Open the opening tag
      xml.push(`<${this.name}`);

      // Add attributes
      if (typeof this.attributes !== "undefined") {
        for (const [k, v] of Object.entries(this.attributes)) {
          xml.push(` ${k}="${v.replaceAll('"', "&quot;")}"`);
        }
      }

      if (this.children.length === 0 && typeof this.content === "undefined") {
        // Close the tag
        xml.push(` />`);
      } else {
        // Close the opening tag
        xml.push(`>`);

        // Add the children
        for (const child of this.children) {
          xml.push(child.toString(false)); // no need fmt recursively
        }

        // Add any content
        if (typeof this.content !== "undefined") {
          xml.push(this.content);
        }

        // Add the closing tag
        xml.push(`</${this.name}>`);
      }
    }

    if (fmt) {
      return xmlFmt(xml.join(""), {
        collapseContent: true,
        indentation: "  ",
        whiteSpaceAtEndOfSelfclosingTag: true,
      });
    }

    return xml.join("");
  }
}

interface NodeArgs {
  name: string;
  content: string | undefined;
  attributes: Record<string, string> | undefined;
  builder: ((parent: XmlElement) => void) | undefined;
}

function parseArgs(...args: unknown[]): NodeArgs {
  if (args.length === 0) {
    throw new Error("No args to parse");
  }

  if (typeof args[0] !== "string") {
    throw new Error("an element name must be provided");
  }
  const name = args[0];

  let content: string | undefined = undefined;
  if (typeof args[1] === "string") {
    content = args[1];
  } else {
    if (typeof args[2] === "string") {
      content = args[2];
    }
  }

  let attributes: Record<string, string> | undefined = undefined;
  if (typeof args[1] === "object" && args[1] !== null) {
    attributes = args[1] as Record<string, string>;
  }

  let builder: ((parent: XmlElement) => void) | undefined = undefined;
  if (typeof args[1] === "function") {
    builder = args[1] as (parent: XmlElement) => void;
  } else {
    if (typeof args[2] === "function") {
      builder = args[2] as (parent: XmlElement) => void;
    } else {
      if (typeof args[3] === "function") {
        builder = args[3] as (parent: XmlElement) => void;
      }
    }
  }

  return { name, content, attributes, builder };
}
