import { Build } from "../build.ts";
import { AllXOR } from "../../types.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface RubyEnvConfiguratorBuildExtensionProps
  extends BaseBuildExtensionProps {
  /**
   * The configurator can use many different methods for setting up
   * the Ruby interpreter.
   *
   * - rvm: https://rvm.io/
   * - rbenv: https://github.com/rbenv/rbenv
   * - path: Or just by means of a simple path to the interpreter.
   */
  strategy: AllXOR<[
    {
      /**
       * Leave empty to search interpreter in the PATH environment variable.
       */
      path: string;
    },
    {
      rvm: AllXOR<[{
        /**
         * E.g.: ruby-1.8.7-p249, jruby-1.4.0 or system
         */
        interpreter: string;

        /**
         * Leave empty to use default gemset.
         */
        gemset?: string;

        /**
         * Defaults to `false`.
         */
        createGemsetIfNotExist?: boolean;
      }, {
        /**
         * Path relative to a checkout directory. Leave empty to use ".rvmrc"
         */
        rvmrc: string;
      }, {
        /**
         * Path to a directory with '.ruby-version' and '.ruby-gemset' files.
         * Path relative to a checkout directory. Leave empty to use checkout directory.
         */
        dir: string;
      }]>;
    },
    {
      rbenv: AllXOR<[{
        /**
         * E.g.: 1.9.3-p286 or jruby-1.7.0
         */
        interpreter: string;
      }, {
        /**
         * Path to a directory with '.ruby-version' or '.rbenv-version' file.
         * Path relative to a checkout directory. Leave empty to use
         * ".ruby-version"(preferred) or ".rbenv-version".
         */
        dir: string;
      }]>;
    },
  ]>;

  /**
   * Check the option to fail a build if the Ruby environment configurator
   * cannot pass the Ruby interpreter to the step execution environment
   * because the interpreter wasn't found on the agent.
   *
   * Defaults to `true`.
   *
   * see: https://www.jetbrains.com/help/teamcity/ruby-environment-configurator.html#Ruby+Environment+Configurator+Settings
   */
  failBuildIfNotFound?: boolean;
}

/**
 * The Ruby environment configurator build feature passes Ruby interpreter to
 * all build steps. The build feature adds the selected Ruby interpreter and
 * gems bin directories to the system PATH environment variable and configures
 * other necessary environment variables in case of the RVM interpreter.
 *
 * see: https://www.jetbrains.com/help/teamcity/ruby-environment-configurator.html
 */
export class RubyEnvConfiguratorBuildExtension
  extends BaseBuildExtension<RubyEnvConfiguratorBuildExtensionProps> {
  constructor(scope: Build, props: RubyEnvConfiguratorBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("ruby.env.configurator", (x) => {
      x.Node("parameters", (x) => {
        if (typeof this.props.strategy.path !== "undefined") {
          x.Node("param", {
            name: "ui.ruby.configurator.rvm.gemset.create.if.non.exists",
            value: "true",
          });

          x.Node("param", {
            name: "ui.ruby.configurator.rvm.rvmrc.path",
            value: ".rvmrc",
          });

          if (this.props.strategy.path !== "") {
            x.Node("param", {
              name: "ui.ruby.configurator.ruby.interpreter.path",
              value: this.props.strategy.path,
            });
          }
        } else {
          if (typeof this.props.strategy.rvm !== "undefined") {
            if (typeof this.props.strategy.rvm.interpreter !== "undefined") {
              x.Node("param", {
                name: "ui.ruby.configurator.use.rvm",
                value: "manual",
              });

              x.Node("param", {
                name: "ui.ruby.configurator.rvm.sdk.name",
                value: this.props.strategy.rvm.interpreter,
              });

              if (typeof this.props.strategy.rvm.gemset !== "undefined") {
                x.Node("param", {
                  name: "ui.ruby.configurator.rvm.gemset.name",
                  value: this.props.strategy.rvm.gemset,
                });
              }

              x.Node("param", {
                name: "ui.ruby.configurator.rvm.gemset.create.if.non.exists",
                value: (this.props.strategy.rvm.createGemsetIfNotExist ?? false)
                  ? "true"
                  : "false",
              });
            } else {
              if (typeof this.props.strategy.rvm.rvmrc !== "undefined") {
                x.Node("param", {
                  name: "ui.ruby.configurator.use.rvm",
                  value: "rvmrc",
                });

                x.Node("param", {
                  name: "ui.ruby.configurator.rvm.rvmrc.path",
                  value: this.props.strategy.rvm.rvmrc === ""
                    ? ".rvmrc"
                    : this.props.strategy.rvm.rvmrc,
                });
              } else {
                if (typeof this.props.strategy.rvm.dir !== "undefined") {
                  x.Node("param", {
                    name: "ui.ruby.configurator.use.rvm",
                    value: "rvm_ruby_version",
                  });

                  if (this.props.strategy.rvm.dir !== "") {
                    x.Node("param", {
                      name: "ui.ruby.configurator.rvm.ruby_version.path",
                      value: this.props.strategy.rvm.dir,
                    });
                  }
                } else {
                  throw new Error("unexpected this.props.strategy object");
                }
              }
            }
          } else {
            if (typeof this.props.strategy.rbenv !== "undefined") {
              x.Node("param", {
                name: "ui.ruby.configurator.rbenv.root.path",
                value: "%env.RBENV_ROOT%",
              });
              if (
                typeof this.props.strategy.rbenv.interpreter !== "undefined"
              ) {
                x.Node("param", {
                  name: "ui.ruby.configurator.use.rvm",
                  value: "rbenv",
                });
                x.Node("param", {
                  name: "ui.ruby.configurator.rbenv.version.name",
                  value: this.props.strategy.rbenv.interpreter,
                });
              } else {
                if (typeof this.props.strategy.rbenv.dir !== "undefined") {
                  x.Node("param", {
                    name: "ui.ruby.configurator.use.rvm",
                    value: "rbenv_file",
                  });
                  x.Node("param", {
                    name: "ui.ruby.configurator.rbenv.file.path",
                    value: this.props.strategy.rbenv.dir,
                  });
                } else {
                  throw new Error("unexpected this.props.strategy object");
                }
              }
            } else {
              throw new Error("unexpected this.props.strategy object");
            }
          }
        }

        x.Node("param", {
          name: "ui.ruby.configurator.fail.build.if.interpreter.not.found",
          value: (this.props.failBuildIfNotFound ?? true) ? "true" : "false",
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new RubyEnvConfiguratorBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.RubyEnvConfiguratorExtension({ ... });
     *  });
     * });
     * ```
     */
    RubyEnvConfiguratorExtension(
      props: RubyEnvConfiguratorBuildExtensionProps,
    ): RubyEnvConfiguratorBuildExtension;
  }
}

Build.prototype.RubyEnvConfiguratorExtension = function (
  this: Build,
  props: RubyEnvConfiguratorBuildExtensionProps,
) {
  return new RubyEnvConfiguratorBuildExtension(this, props);
};
