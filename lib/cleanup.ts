import { Build } from "./build/build.ts";
import {
  CleanupPolicy,
  CleanupPolicyArtifacts,
  CleanupPolicyBase,
  CleanupPolicyEverything,
  CleanupPolicyHistory,
} from "./cleanup_policy.ts";
import { Construct } from "./construct.ts";
import { Project } from "./project/project.ts";
import { XmlElement } from "./xml.ts";

export interface CleanupProps extends Record<string, unknown> {
  /**
   * Whether or not the defined clean-up policies are actually enabled or not.
   *
   * Defaults to `false`.
   */
  disableCleanupPolicies?: boolean;

  /**
   * This setting affects clean-up of artifacts in builds of the dependency
   * build configurations.
   *
   * - `undefined` = Use default
   * - `true` = Prevent clean-up
   * - `false` = Do not prevent clean-up
   */
  preventDependenciesArtifactsFromCleanup?: boolean;

  /**
   * A list of base policies to apply to the project or build.
   *
   * Base policies allows for preserving build data using simple settings.
   * The policies are applied considering branches, personal and canceled
   * builds, etc...
   *
   * > HINT: You can combine these with `KeepRulesProjectExtension` or
   * >       `KeepRulesBuildExtension` to cater for more complex needs.
   *
   * see: https://www.jetbrains.com/help/teamcity/clean-up.html#Base+Rule
   */
  policies?: CleanupPolicy[];
}

/**
 * TeamCity clean-up functionality allows an automatic deletion of old and no
 * longer necessary build data.
 *
 * > HINT: Cleanup rules can be applied at the Project & Build levels.
 *
 * see: https://www.jetbrains.com/help/teamcity/clean-up.html
 */
export class Cleanup extends Construct<CleanupProps, Project | Build> {
  constructor(scope: Project | Build, builder?: (c: Cleanup) => void);
  constructor(
    scope: Project | Build,
    props: CleanupProps,
    builder?: (c: Cleanup) => void,
  );
  constructor(...args: unknown[]) {
    const scope = args[0] as Project | Build;

    let props: CleanupProps | undefined = undefined;
    let builder: ((c: Cleanup) => void) | undefined = undefined;
    if (typeof args[1] === "function") {
      builder = args[1] as (c: Cleanup) => void;
    }
    if (typeof args[2] === "function") {
      props = args[1] as CleanupProps;
      builder = args[2] as (c: Cleanup) => void;
    }

    super(scope, props ?? {}, builder);

    if (typeof scope.cleanupRules !== "undefined") {
      throw new Error("Cleanup is a singleton");
    }

    // deno-lint-ignore no-explicit-any
    (scope as any).cleanupRules = this;
    (scope as Construct<Record<string, unknown>>)["_addXmlBuilder"]( // not sure why we need this extra type cast???
      Cleanup,
      (x) => x.Node(this.toXml()),
    );
  }

  /**
   * Creates a new cleanup policy that applies to everything.
   *
   * ```ts
   * new Project({id: "MyPipeline"}, (p) => {
   *  p.Cleanup((c) => c.EveryThing({ keepDays: 90 }));
   * });
   * ```
   */
  Everything(props: CleanupPolicyBase) {
    Construct.push(this.props, "policies", {
      cleanupLevel: "EVERYTHING",
      keepBuilds: props?.keepBuilds,
      keepDays: props?.keepDays,
    } as CleanupPolicyEverything);
  }

  /**
   * Creates a new cleanup policy that applies to history entries.
   *
   * ```ts
   * new Project({id: "MyPipeline"}, (p) => {
   *  p.Cleanup((c) => c.History({ keepDays: 90 }));
   * });
   * ```
   */
  History(props: CleanupPolicyBase) {
    Construct.push(this.props, "policies", {
      cleanupLevel: "HISTORY_ENTRY",
      keepBuilds: props?.keepBuilds,
      keepDays: props?.keepDays,
    } as CleanupPolicyHistory);
  }

  /**
   * Creates a new cleanup policy that applies to artifacts.
   *
   * ```ts
   * new Project({id: "MyPipeline"}, (p) => {
   *  p.Cleanup((c) => c.Artifacts({ keepDays: 90 }));
   * });
   * ```
   */
  Artifacts(
    props: CleanupPolicyBase & {
      /**
       * An optional list of artifact patterns to match against.
       * In the form of `+:/-:` Ant-style pattern wildcard.
       *
       * > HINT: If left undefined any artifact that matches the `keepDays` /
       * >       `keepBuilds` properties will be deleted.
       */
      patterns?: string[];
    },
  ) {
    Construct.push(this.props, "policies", {
      cleanupLevel: "ARTIFACTS",
      keepBuilds: props?.keepBuilds,
      keepDays: props?.keepDays,
      patterns: props.patterns,
    } as CleanupPolicyArtifacts);
  }

  toXml(): XmlElement {
    return new XmlElement("cleanup", (x) => {
      x.Node("options", (x) => {
        x.Node("option", {
          name: "disableCleanupPolicies",
          value: (this.props.disableCleanupPolicies ?? false)
            ? "true"
            : "false",
        });
        x.Node("option", {
          name: "preventDependenciesArtifactsFromCleanup",
          value: (this.props.preventDependenciesArtifactsFromCleanup ?? false)
            ? "true"
            : "false",
        });
      });

      if (
        Array.isArray(this.props.policies) && this.props.policies.length > 0
      ) {
        for (const policy of this.props.policies) {
          if (
            typeof policy.keepDays === "undefined" &&
            typeof policy.keepBuilds === "undefined"
          ) {
            throw new Error(
              "project cleanup policy needs to define at least one of `keepDays` or `keepBuilds`",
            );
          }
          x.Node("policy", {
            type: "daysAndBuilds",
            "cleanup-level": policy.cleanupLevel,
          }, (x) => {
            x.Node("parameters", (x) => {
              if (typeof policy.keepDays !== "undefined") {
                x.Node("param", {
                  name: "keepDays.count",
                  value: policy.keepDays.toString(),
                });
              }

              if (typeof policy.keepBuilds !== "undefined") {
                x.Node("param", {
                  name: "keepBuilds.count",
                  value: policy.keepBuilds.toString(),
                });
              }

              if (policy.cleanupLevel === "ARTIFACTS") {
                if (typeof policy.patterns !== "undefined") {
                  x.Node(
                    "param",
                    { name: "artifactPatterns" },
                    (x) => x.CDATA(policy.patterns!.join("\n")),
                  );
                }
              }
            });
          });
        }
      }
    });
  }
}

declare module "./project/project.ts" {
  interface Project {
    /**
     * A readonly list of Cleanup rules added to this Project.
     */
    readonly cleanupRules?: Cleanup;

    /**
     * Adds a new Cleanup rule to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.Cleanup(...);
     * });
     * ```
     */
    Cleanup(props: CleanupProps): Cleanup;
    Cleanup(builder: (c: Cleanup) => void): Cleanup;
    Cleanup(props: CleanupProps, builder: (c: Cleanup) => void): Cleanup;
  }
}

Project.prototype.Cleanup = function (this: Project, ...args: unknown[]) {
  if (typeof args[0] === "function") {
    return new Cleanup(this, args[0] as (c: Cleanup) => void);
  }

  if (typeof args[0] === "object" && typeof args[1] === "function") {
    return new Cleanup(
      this,
      args[0] as CleanupProps,
      args[1] as (c: Cleanup) => void,
    );
  }

  if (typeof args[0] === "object") {
    return new Cleanup(this, args[0] as CleanupProps);
  }

  throw new Error("failed to parse input args");
};

declare module "./build/build.ts" {
  interface Build {
    /**
     * A readonly list of Cleanup rules added to this Build.
     */
    readonly cleanupRules?: Cleanup;

    /**
     * Adds a new parameter to a Build.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.Build({id: "MyBuild"}, (b) => {
     *    b.Cleanup(...);
     *  });
     * });
     * ```
     */
    Cleanup(props: CleanupProps): Cleanup;
    Cleanup(builder: (c: Cleanup) => void): Cleanup;
    Cleanup(props: CleanupProps, builder: (c: Cleanup) => void): Cleanup;
  }
}

Build.prototype.Cleanup = function (this: Build, ...args: unknown[]) {
  if (typeof args[0] === "function") {
    return new Cleanup(this, args[0] as (c: Cleanup) => void);
  }

  if (typeof args[0] === "object" && typeof args[1] === "function") {
    return new Cleanup(
      this,
      args[0] as CleanupProps,
      args[1] as (c: Cleanup) => void,
    );
  }

  if (typeof args[0] === "object") {
    return new Cleanup(this, args[0] as CleanupProps);
  }

  throw new Error("failed to parse input args");
};
