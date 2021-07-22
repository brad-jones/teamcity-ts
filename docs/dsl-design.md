# DSL Design (in TypeScript)

Building a useful & powerful DSL is hard. This document takes you through my
thought processes and some decisions I have made when building this SDK.

## Why use TypeScript to build a DSL?

- JavaScript & by extension TypeScript is one of the most ubiquitous languages
  on the planet. Other projects like the
  [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html) have
  successfully built similar, arguably much more complex, yet accessible DSLs on
  top of TypeScript.

- The tooling for JavaScript/TypeScript is very mature. VsCode ships with
  TypeScript support out of the box and it just works.

- TypeScript being based on JavaScript is a very flexible language that you can
  bend in interesting ways which enables one to craft a DSL that is friendly to
  use.

- Although admittedly this may make the authoring of the DSL it's self more
  difficult. For me it's all about the developer experience _of the developer
  using the DSL_.

## Why not just use the AWS Constructs Lib?

<https://github.com/aws/constructs> is a thing that already exists & I have
considered building on top of this but the main blocker here is that there is
very little documentation and guidance on how to use that library outside of the
[AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html).

## What about Kotlin DSLs?

Well considering this project started because we kept running into issues with
the OEM TeamCity Kotlin DSL I think this should be self explanatory but the main
concern is the Kotlin tooling support is not mature enough IMO _(at least in
VsCode)_.

I do however acknowledge Kotlin as a language has some great features to enable
one to build DSLs on top of it.

<https://kotlinlang.org/docs/type-safe-builders.html>

## DSL Structures

There are a number of patterns I have considered, below demonstrates the
evolution of my thinking.

### Plain Old JavaScript Objects

Initially I started this project with the idea that I was going to write a YAML
to XML conversion tool. I would produce a JSON Schema and you would just write
your TeamCity pipeline in YAML like any other proper CI system.

Inevitably this SDK will never implement 100% of the TeamCity functionality 100%
of the time. So there needs to be a way to extend this SDK on an as needed
basis, we need some form of escape hatch.

Similar to the escape hatches in the
[CDK](https://docs.aws.amazon.com/cdk/latest/guide/cfn_layer.html).

Where this idea came unstuck was how to represent the escape hatches in the YAML
_(or JSON Schema)_. The escape hatches need to communicate the XML specifics
like attributes, children elements, cdata tags, etc... ultimately this leads to
a horrible leaky abstraction that I just didn't like the look of.

```json
{
  "id": "Main",
  "name": "Main Pipeline",
  "builds": [
    {
      "id": "BuildFoo",
      "name": "Build Foo",
      // This represents a <build-extensions> tag,
      // How do you add a new attribute to that opening tag?
      "extensions": [
        {
          "type": "AutoMergeFeature",
          "srcBranchFilter": ["+:feature/*", "-:fix/*"],
          "dstBranch": "master"
        }
      ]
    }
  ]
}
```

### Controller Pattern

I then considered the classic Controller pattern, where a classes methods
represent build steps of a pipeline. The problem with this is it relies heavily
on reflection & JavaScript has a poor reflective model.

Perhaps in a language like C# this would be easier to implement but C# feels too
heavy for this task. I don't want to have to define an entire solution and
project just for a simple pipeline definition.

Especially when compared to using Deno, I can just have a single self contained
TypeScript file.

It's also unclear how the various intricate details of the TeamCity pipeline
configuration would be represented here. Meta-programming doesn't scale very
well. I don't want 100 & 1 different attributes/decorators.

```ts
class MyPipeline extends Project {
  lint() {
  }

  @DependsOn(this.lint)
  test() {
  }

  @DependsOn(this.test)
  build() {
  }

  @DependsOn(this.test)
  package() {
  }

  @DependsOn(this.publish)
  publish() {
  }

  @DependsOn(this.publish)
  deploy() {
  }
}
```

### The Builder Pattern

The next thing I looked at was how to construct a DSL using the builder pattern.
The problem is how do you enforce required properties _(in this case the `Id`)_
to be filled in?

> Interestingly Kotlin DSL until recently had a similar problem. see:
> <https://stackoverflow.com/questions/53651519>

```ts
Project((p: Project) =>
  p.Id("MyPipeline").Build((b: Build) =>
    b.Id("MyBuild").Step((s) => s.Id("MyStep").Runs("ping 1.1.1.1"))
  )
);
```

The obvious answer is to require additional parameters in the function signature
like this:

```ts
Project(
  "MyPipeline",
  (p: Project) =>
    p.Build(
      "MyBuild",
      (b: Build) => b.Step("MyStep", (s) => s.Runs("ping 1.1.1.1")),
    ),
);
```

But this doesn't scale well for many required properties. The solution just ask
for all the required properties like this:

```ts
Project(
  { id: "MyPipeline" },
  (p: Project) =>
    p.Build(
      { id: "MyBuild" },
      (b: Build) => b.Step({ id: "MyStep" }, (s) => s.Runs("ping 1.1.1.1")),
    ),
);
```

The next problem was how do we allow the DSL to be extended for exceptional
cases that we do not yet natively support out of the box? I considered something
like the following:

```ts
new Project({ id: "MyPipeline" }, (p) => {
  new Build(p, { id: "MyBuild" }, (b) => {
    new Step(b, { id: "MyStep" }, (s) => {
      s.run = "ping 1.1.1.1";
    });
    new CustomStep(b, { id: "MyStep" }, (s) => {
      s.run = "ping 1.1.1.1";
    });
  });
});

// CustomStep can be any class imported from anywhere, it might look like:
class CustomStep extends Step { ... }
```

But I didn't like this because it makes it harder for the developer using the
DSL to work out which classes are valid where. It's still totally type safe and
you will get a compilation error if you use a class in the incorrect context. I
just feel that it adds additional cognitive load & makes discovery of the DSL
not as fluent.

> Interestingly Kotlin solves this issue with some attributes. see:
> <https://kotlinlang.org/docs/type-safe-builders.html#scope-control-dslmarker>

The way I have chosen to solve it is go back to a DSL that looks like this.

```ts
new Project({ id: "MyPipeline" }, (p) => {
  p.Build({ id: "MyBuild" }, (b) => {
    b.Step({ id: "MyStep" }, (s) => {
      s.run = "ping 1.1.1.1";
    });
  });
});
```

## What about Escape Hatches?

I decided that escape hatches should remain 100% type safe and not leak any of
the underlying XML details to the user of the escape hatch.

Normally extending the prototype is frowned upon but in this case I am happy to
do so. We are not extending built-ins or anything crazy like that...

Write the extension, unblock yourself & then submit a PR _(or just an issue with
a link to the extension)_ and we can merge the new functionality in.

Anyway this is what that might look like.

```ts
import { Project } from "https://deno.land/teamcity-ts/mod.ts";
import "https://deno.land/teamcity-ts-custom-step/extensions.ts";

new Project({ id: "MyPipeline" }, (p) => {
  p.Build({ id: "MyBuild" }, (b) => {
    b.Step({ id: "MyStep" }, (s) => {
      s.run = "ping 1.1.1.1";
    });
    b.CustomStep({ id: "MyCustomStep" }, (s) => {
      s.run = "ping 1.0.0.1";
    });
  });
});
```

In fact the entire SDK is built on top of prototype extensions. Read more:
<https://github.com/brad-jones/teamcity-ts/master/blob/docs/extending.md>

## The best of all worlds

In the end the final DSL can be used in 2 different ways, which you may choose
to mix & match as you wish.

### Fluent

```ts
new Project({ id: "MyPipeline" }, (p) => {
  p.Build({ id: "MyBuild" }, (b) => {
    b.Step({ id: "MyStep" }, (s) => {
      s.run = "ping 1.1.1.1";
    });
  });
});
```

### Classical

```ts
const p = new Project({ id: "MyPipeline" });
const b = new Build(p, { id: "MyBuild" });
const s = new Step(b, { id: "MyStep" }, (s) => {
  s.run = "ping 1.1.1.1";
});
```
