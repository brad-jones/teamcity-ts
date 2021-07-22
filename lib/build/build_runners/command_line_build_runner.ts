import { Build } from "../build.ts";
import { AllXOR } from "../../types.ts";
import { XmlElement } from "../../xml.ts";
import { BaseBuildRunner, BaseBuildRunnerProps } from "./base_build_runner.ts";

export type CommandLineBuildRunnerProps =
  & BaseBuildRunnerProps
  & {
    /**
     * Specify the working directory where the command is to be run
     * (if it differs from the build checkout directory).
     */
    cwd?: string;

    /**
     * Specify how the error output is handled by the runner:
     *
     * - `true`: any output to stderr is handled as an error
     * - `false`: any output to stderr is handled as a warning
     *
     * Defaults to `false`.
     */
    fmtStdErrAsErrors?: boolean;

    /**
     * In this section, you can specify a Docker image which will be used
     * to run this build step.
     *
     * see: https://www.jetbrains.com/help/teamcity/docker-wrapper.html
     */
    runInContainer?: {
      /**
       * The image to run the command inside of.
       */
      image: string;

      /**
       * Docker now supports Linux & Windows contains natively.
       * What type of container is it?
       *
       * Defaults to `linux`.
       */
      platform?: "linux" | "windows";

      /**
       * If enabled, the image will be pulled from the repository via
       * `docker pull <imageName>` before the `docker run` command is launched.
       *
       * Defaults to `false`.
       */
      pull?: boolean;

      /**
       * Allows specifying additional options for the docker run command.
       *
       * The default argument is `--rm`, but you can provide more, for instance,
       * add an additional volume mapping.
       *
       * > HINT: In this field, you cannot reference environment variables using
       * > the `%env.FOO_BAR%` syntax because TeamCity does not pass environment
       * > variables from a build agent into a Docker container. If you need to
       * > reference an environment variable on an agent, define the configuration
       * > parameter `system.FOO_BAR=env_var_value` in `buildAgent.properties`
       * > and reference it via `%system.FOO_BAR%`.
       */
      args?: string[];
    };
  }
  & AllXOR<[{
    /**
     * Specify the path to an executable to be started.
     */
    cmd: string;

    /**
     * A list of command line arguments to pass to the executable.
     */
    args?: string[];
  }, {
    /**
     * A platform-specific script which will be executed as an executable script
     * in Unix-like environments and as a *.cmd batch file on Windows.
     *
     * Under Unix-like OS the script is saved with the executable bit set and is
     * then executed by OS. This defaults to /bin/sh interpreter on the most
     * systems.
     *
     * If you need a specific interpreter to be used, specify shebang
     * (for example, #!/bin/bash) as the first line of the script.
     *
     * > HINT: TeamCity treats a string surrounded by percentage signs `%` in
     * > the script as a parameter reference. To prevent TeamCity from treating
     * > the text in the percentage signs as a property reference, use double
     * > percentage signs to escape them: for example, if you want to pass
     * > `%Y%m%d%H%M%S` into the build, change it to `%%Y%%m%%d%%H%%M%%S`.
     */
    script: string;
  }]>;

/**
 * Using the Command Line build runner, you can run any script
 * supported by the OS.
 *
 * see: https://www.jetbrains.com/help/teamcity/command-line.html
 */
export class CommandLineBuildRunner
  extends BaseBuildRunner<CommandLineBuildRunnerProps> {
  constructor(scope: Build, props: CommandLineBuildRunnerProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("simpleRunner", (x) => {
      if (typeof this.props.name !== "undefined") {
        x.Attribute("name", this.props.name);
      }

      if (
        Array.isArray(this.props.conditions) && this.props.conditions.length > 0
      ) {
        x.Node("conditions", (x) => {
          for (const item of this.props.conditions!) {
            x.Node(item.condition, {
              name: item.name,
            }, (x) => {
              // deno-lint-ignore no-explicit-any
              const v = (item as any).value;
              if (typeof v !== "undefined") {
                x.Attribute("value", v);
              }
            });
          }
        });
      }

      x.Node("parameters", (x) => {
        x.Node("param", {
          name: "teamcity.step.mode",
          value: this.props.executionPolicy ?? "default",
        });

        if (typeof this.props.cwd !== "undefined") {
          x.Node("param", {
            name: "teamcity.build.workingDir",
            value: this.props.cwd,
          });
        }

        x.Node("param", {
          name: "log.stderr.as.errors",
          value: (this.props.fmtStdErrAsErrors ?? false) ? "true" : "false",
        });

        if (typeof this.props.runInContainer !== "undefined") {
          x.Node("param", {
            name: "plugin.docker.imageId",
            value: this.props.runInContainer.image,
          });

          x.Node("param", {
            name: "plugin.docker.imagePlatform",
            value: this.props.runInContainer.platform ?? "linux",
          });

          x.Node("param", {
            name: "plugin.docker.pull.enabled",
            value: (this.props.runInContainer.pull ?? false) ? "true" : "false",
          });

          if (
            Array.isArray(this.props.runInContainer.args) &&
            this.props.runInContainer.args.length > 0
          ) {
            x.Node(
              "param",
              {
                name: "plugin.docker.run.parameters",
                value: this.props.runInContainer.args.join(" "), // TODO: figure out the best way to deal with quotes
              },
            );
          }
        }

        if (typeof this.props.cmd !== "undefined") {
          x.Node("param", {
            name: "command.executable",
            value: this.props.cmd,
          });
          if (Array.isArray(this.props.args) && this.props.args.length > 0) {
            x.Node("param", {
              name: "command.parameters",
              value: this.props.args.join(" "), // TODO: figure out the best way to deal with quotes
            });
          }
        } else {
          if (typeof this.props.script !== "undefined") {
            x.Node("param", { name: "use.custom.script", value: "true" });
            x.Node("param", { name: "script.content" }, this.props.script);
          }
        }
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new CommandLineBuildRunner to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.CommandLineRunner({ ... });
     *  });
     * });
     * ```
     */
    CommandLineRunner(
      props: CommandLineBuildRunnerProps,
    ): CommandLineBuildRunner;
  }
}

Build.prototype.CommandLineRunner = function (
  this: Build,
  props: CommandLineBuildRunnerProps,
) {
  return new CommandLineBuildRunner(this, props);
};
