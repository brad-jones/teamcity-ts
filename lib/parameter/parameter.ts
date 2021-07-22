import { Build } from "../build/build.ts";
import { Project } from "../project/project.ts";
import { XmlElement } from "../xml.ts";
import { Construct } from "../construct.ts";
import { ParameterSpec } from "./parameter_spec.ts";
import { specBuilder } from "./parameter_spec_builder.ts";

export interface ParameterProps extends Record<string, unknown> {
  /**
   * The name of the parameter key, may contain dots.
   *
   * eg: `foo.bar.baz`
   */
  readonly name: string;

  /**
   * The value of the parameter.
   *
   * Parameters may reference other parameter names.
   * eg: `%foo.bar.baz%`
   */
  readonly value: string;

  /**
   * Parameters have a sub type which changes how they work in TeamCity.
   * eg: You can have a Password Parameter which masks it's value with ***.
   *
   * see: https://www.jetbrains.com/help/teamcity/typed-parameters.html#Manually+Configuring+Parameter+Specification
   */
  readonly spec?: ParameterSpec;
}

/**
 * Projects can define parameters so too can Builds.
 *
 * There are 3 main types of parameters:
 *
 * - Regular: These have no special meaning or rules attached to them.
 *   These configuration parameters are not passed into build, can be used in
 *   references only. eg: `%foo%`
 *
 * - System: If the key starts with `system.`, then these are passed into the
 *   build scripts of the supported runners as variables specific to a build tool.
 *
 * - Environment: If the key starts with `env.`, then the value will be injected
 *   into an environment variable of the same name, minus the `env.` prefix.
 *
 * see: https://www.jetbrains.com/help/teamcity/2020.2/configuring-build-parameters.html
 */
export class Parameter extends Construct<ParameterProps, Project | Build> {
  /**
   * Creates a new Project or Build parameter.
   *
   * ```ts
   * new Project({id: "MyPipeline"}, (p) => {
   *  new Parameter(p, {name: "foo", value: "abc"});
   *
   *  new Build(p, {id: "MyBuild"}, (b) => {
   *    new Parameter(p, {name: "bar", value: "xyz"});
   *  });
   * });
   * ```
   */
  constructor(scope: Project | Build, props: ParameterProps) {
    super(scope, props);
    Construct.push(scope, "parameters", this);
    (scope as Construct<Record<string, unknown>>)["_addXmlBuilder"]( // not sure why we need this extra type cast???
      Parameter,
      (x: XmlElement) => {
        x.Node("parameters", (x) => {
          for (const parameter of scope.parameters ?? []) {
            x.Node(parameter.toXml());
          }
        });
      },
    );
  }

  toString() {
    return `%${this.props.name}%`;
  }

  toXml(): XmlElement {
    return new XmlElement("param", { name: this.props.name }, (x) => {
      if (typeof this.props.spec !== "undefined") {
        x.Attribute("spec", specBuilder(this.props.spec));
      }
      if (this.props.value.includes("\n")) {
        x.content = this.props.value;
      } else {
        x.Attribute("value", this.props.value);
      }
    });
  }
}

declare module "../project/project.ts" {
  interface Project {
    /**
     * A readonly list of Parameters added to this Project.
     */
    readonly parameters?: readonly Parameter[];

    /**
     * Adds a new parameter to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.Parameter({name: "foo", value: "abc"});
     * });
     * ```
     */
    Parameter(props: ParameterProps): Parameter;
  }
}

declare module "../build/build.ts" {
  interface Build {
    /**
     * A readonly list of Parameters added to this Build.
     */
    readonly parameters?: readonly Parameter[];

    /**
     * Adds a new parameter to a Build.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.Build({id: "MyBuild"}, (b) => {
     *    b.Parameter({name: "foo", value: "abc"});
     *  });
     * });
     * ```
     */
    Parameter(props: ParameterProps): Parameter;
  }
}

Project.prototype.Parameter = function (this: Project, props: ParameterProps) {
  return new Parameter(this, props);
};

Build.prototype.Parameter = function (this: Project, props: ParameterProps) {
  return new Parameter(this, props);
};
