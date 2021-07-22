# How to extend this DSL

Inevitably this SDK will never implement 100% of the TeamCity functionality 100%
of the time. So there needs to be a way to extend this SDK on an as needed
basis, we need some form of escape hatch.

## The JavaScript Prototype

Now I know what your thinking, you have been taught never to extend the
prototype, it leads to all sorts of nasty surprises and is generally considered
bad practice.

This advice is sound advice when dealing with Built-In objects & types but we
are extending user defined objects in a purposeful, structured manner so I think
it's ok in this instance.

Not sure what the prototype is, read more here:
<https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object_prototypes>

## The basic shape of a DSL Construct

Here we show an example of what a new DSL Construct looks like, what parts must
be defined, what other parts of optional, etc...

> HINT: Yes naming totally inspired by the
> [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html) but only the
> name, not much else.

```ts
// Step 1: Import the base Construct class.
// It's not exported by teamcity-ts/mod.ts just to keep the API surface small.
import { Construct } from "https://deno.land/x/teamcity-ts/lib/construct.ts";

// Step 2: Import the parent Construct class from it's original declaration.
// Importing from re-exported declarations, such as from mod.ts will not allow
// you to extend the prototype correctly.
import { Project } from "https://deno.land/x/teamcity-ts/lib/project/project.ts";

// Step 3: Define an interface which represents the configuration for TeamCity
// that you wish to capture. Yes it must extend `Record<string, unknown>`.
// As a rule of thumb you want to make required properties readonly.
export interface MyNewConstructProps extends Record<string, unknown> {
  readonly id: string;
  foo?: string;
  bar?: number;
}

// Step 4: Declare the new extensions to the parent Construct class.
declare module "https://deno.land/x/teamcity-ts/lib/project/project.ts" {
  interface Project {
    // Here we are creating a location to store instances of our new DSL Construct
    // scoped to the parent Construct. Note that both the property itself & the
    // array are readonly. This is just so that we communicate to the DSL user
    // that they probably shouldn't be messing around with this outside of the
    // below DSL method. Of course it's just JavaScript under the hood so they
    // can still do what they like in exceptional cases.
    readonly myNewConstructs?: readonly MyNewConstruct[];

    // Here we are creating a new fluent method on the parent Construct,
    // strictly this isn't needed but it is the syntax sugar that makes
    // the DSL more friendly to work with.
    MyNewConstruct(
      props: MyNewConstructProps,
      builder?: (_: MyNewConstruct) => void,
    ): MyNewConstruct;
  }
}

// Step 5: Provide an actual implementation for the new fluent method.
Project.prototype.MyNewConstruct = function (
  this: Project,
  props: MyNewConstructProps,
  builder?: (_: MyNewConstruct) => void,
) {
  return new MyNewConstruct(this, props, builder);
};

// Step 6: Create your new DSL Construct by extending the base Construct class.
// The first generic argument is your properties interface & the second argument
// is the parent DSL Construct that you are extending.
export class MyNewConstruct extends Construct<MyNewConstructProps, Project> {
  constructor(
    scope: Project,
    props: MyNewConstructProps,
    // NOTE: If you know there won't be any further child Constructs
    // below this one, you could omit this parameter.
    builder?: (_: MyNewConstruct) => void,
  ) {
    super(scope, props, builder);

    // This allows you to add new instances into your readonly array,
    // it's essentially a shortcut for:
    // if (!Array.isArray(scope.myNewConstructs)) {
    //   scope.myNewConstructs = [];
    // }
    // scope.myNewConstructs.push(this);
    Construct.push(scope, "myNewConstructs", this);

    // Here we are adding a new XML builder into the parent construct's list of
    // XML builders, which essentially allows this new child construct to extend
    // the parent construct's toXml() method.
    scope["_addXmlBuilder"](MyNewConstruct, (x: XmlElement) => {
      x.Node("my-new-constructs", (x) => {
        for (const myNewConstruct of scope.myNewConstructs ?? []) {
          x.Node(myNewConstruct.toXml());
        }
      });
    });
  }

  // Every Construct must define this method.
  // This is where we serialize an instance of this construct into XML.
  toXml(): XmlElement {
    return new XmlElement("my-new-construct", { id: this.props.id }, (x) => {
      x.Node("foo", this.props.foo ?? "abc");
      x.Node("bar", this.props.bar ?? 123);

      // If we wanted other potential child constructs of this new construct to
      // be able to extend this XML node we would add something like this.
      //
      // Also keep in mind there is no hard requirement for a construct to make
      // it's self extendable in this way. Some constructs are clearly the end
      // of the line & don't need to be extended.
      //
      // And the context in which the parent construct runs it's additional
      // XML builders is totally up to it so you should always inspect the
      // parent construct to understand what part of the XML document you
      // would be extending.
      //
      // TODO: I know this sucks, I shouldn't need these comments here explaining
      // all this but for now thats just how it is. If this PoC actually proves
      // useful I might fix it.
      this._xmlBuilders.forEach((builder) => builder(x));
    });
  }
}
```

## Usage of such a third party DSL extension

This is what it might look like when make use of a third party DSL extension
that isn't directly part of this SDK.

```ts
import { Project } from "https://deno.land/x/teamcity-ts/mod.ts";
import "https://deno.land/x/my-new-construct/extensions.ts";

new Project({ id: "MyPipeline" }, (p) => {
  p.MyNewConstruct({ id: "AbcXyz" });
});
```

Of course if anyone does write extensions for missing parts of the TeamCity
configuration, this project will gladly accept PRs and merge those extensions
into the core product.
