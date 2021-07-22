import { Build } from "./build.ts";
import { Construct } from "../construct.ts";
import { XmlElement } from "../xml.ts";

export interface BuildOptionsProps extends Record<string, unknown> {
  // START: General Settings

  /**
   * Builds of a regular build configuration can have build steps
   * and are executed on agents.
   *
   * Builds of a composite build configuration do not run on an agent.
   * The main purpose of composite build is to aggregate results from
   * snapshot dependencies in a single place.
   *
   * Deployment build configuration publishes / deploys artifacts of
   * other builds to some environment.
   *
   * Defaults to `REGULAR`.
   *
   * see: https://www.jetbrains.com/help/teamcity/deployment-build-configuration.html
   * also: https://www.jetbrains.com/help/teamcity/composite-build-configuration.html
   */
  readonly buildConfigurationType?: "REGULAR" | "DEPLOYMENT" | "COMPOSITE";

  /**
   * A pattern which is resolved and assigned to the build number on the build start.
   *
   * The format may include `%build.counter%` as a placeholder for the build
   * counter value, for example, `1.%build.counter%`. It may also contain a
   * reference to any other available parameter, eg: `%build.vcs.number.VCSRootName%`.
   *
   * > HINT: The maximum length of a build number after all substitutions
   * >       is 256 characters.
   *
   * Defaults to `%build.counter%`.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-general-settings.html#ConfiguringGeneralSettings-BuildNumberFormat
   */
  readonly buildNumberFormat?: string;

  /**
   * Select when to publish artifacts:
   *
   * - EVEN_FAILURES: publish artifacts at the last step of a build if all
   *   previous steps have been completed, successfully or not.
   *
   * - SUCCESSFUL: publish artifacts at the last step of a build if all
   *   previous steps have been completed successfully. TeamCity checks
   *   the current build status on the server before publishing artifacts.
   *
   * - ALWAYS: publish artifacts for all builds, even for interrupted ones
   *   (for example, after the stop command was issued or after the time-out,
   *   specified in the build failure conditions).
   *
   * This setting does not affect artifacts publishing configured in a build script.
   *
   * > HINT: If the stop command is issued during the artifacts publishing,
   * >       the publishing operation will be stopped regardless of the
   * >       selected option.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-general-settings.html#ConfiguringGeneralSettings-PublishArtifacts
   */
  readonly publishArtifacts?: "EVEN_FAILURES" | "SUCCESSFUL" | "ALWAYS";

  /**
   * Patterns to define artifacts of a build. After the first build is run,
   * you can browse the agent checkout directory to configure artifacts paths.
   *
   * Paths are in the form of `[+:]source [ => target]` to include and
   * `-:source [ => target]` to exclude files or directories to publish
   * as build artifacts.
   *
   * Ant-style wildcards are supported, e.g. use `**\/* => target_directory`,
   * `-: ** /folder1 => target_directory` to publish all files except for
   * folder1 into the target_directory.
   *
   * > HINT: `\/` should actually just be `/` in the above example
   * >       but that means this doc block comment breaks.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-general-settings.html#ConfiguringGeneralSettings-ArtifactPaths
   */
  readonly artifactPaths?: string[];

  /**
   * Select the Enable hanging build detection option to detect probably "hanging" builds.
   *
   * A build is considered to be "hanging" if its run time significantly exceeds
   * the estimated average run time and if the build has not sent any messages
   * since the estimation was exceeded.
   *
   * To properly detect hanging builds, TeamCity has to estimate the average
   * time builds run based on several builds. Thus, if you have a new build
   * configuration, it may make sense to enable this feature after a couple
   * of builds have run, so that TeamCity would have enough information to
   * estimate the average run time.
   *
   * Defaults to `false`.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-general-settings.html#Hanging+Build+Detection
   */
  readonly enableHangingBuildsDetection?: boolean;

  /**
   * To allow personal builds or not.
   *
   * A personal build is a build-out of the common build sequence which
   * typically uses the changes not yet committed into the version control.
   *
   * Personal builds are usually initiated from one of the supported IDEs via
   * the Remote Run procedure. You can also upload a patch with changes directly
   * to the server...
   *
   * Defaults to `false`.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-general-settings.html#Allow+Triggering+Personal+Builds
   * also: https://www.jetbrains.com/help/teamcity/personal-build.html
   */
  readonly allowTriggeringPersonalBuilds?: boolean;

  /**
   * This option enables retrieving the status and basic details of the last
   * build in the build configuration without requiring any user authentication.
   *
   * Note that this also allows getting the status of any specific build in
   * the build configuration (however, builds cannot be listed and no other
   * information except the build status (success/failure/internal error/
   * cancelled) is available).
   *
   * The status can be retrieved via the HTML status widget described below,
   * or via a single icon: with the help of REST API or via the Actions menu
   * in Build Configuration Home.
   *
   * Defaults to `true`;
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-general-settings.html#ConfiguringGeneralSettings-EnableStatusWidget
   */
  readonly enableStatusWidget?: boolean;

  /**
   * Limit Number of Simultaneously Running Builds
   *
   * Specify the number of builds of the same configuration that can run
   * simultaneously on all agents. This option helps avoid the situation,
   * when all the agents are busy with the builds of a single project.
   *
   * > HINT: Enter 0 to allow an unlimited number of builds to run simultaneously.
   *
   * Defaults to `0`.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-general-settings.html#Limit+Number+of+Simultaneously+Running+Builds
   */
  readonly maximumNumberOfBuilds?: number;

  // END: General Settings
  // START: Version Control Settings

  /**
   * The VCS Checkout mode is a setting that affects how project sources reach
   * an agent. This mode affects only sources checkout. The current revision
   * and changes data retrieving logic is executed by the TeamCity server,
   * and thus TeamCity server needs to access the VCS server in any mode.
   *
   * - **MANUAL**: TeamCity will not check out any sources automatically,
   *   the default build checkout directory will still be created so that
   *   you could use it to check out the sources via a build script.
   *
   *   Note that TeamCity will accurately report changes only if the checkout
   *   is performed on the revision specified by the `build.vcs.number.*`
   *   properties passed into the build.
   *
   *   The build checkout directory will not be cleaned automatically,
   *   unless the directory expiration period is configured.
   *
   * - **ON_SERVER**: The TeamCity server will export the sources and pass
   *   them to an agent before each build.
   *
   *   Since the sources are exported rather than checked out, no administrative
   *   data is stored in the agent's file system and version control operations
   *   (like check-in, label or update) cannot be performed from the agent.
   *
   *   TeamCity optimizes communications with the VCS servers by caching the
   *   sources and retrieving from the VCS server only the necessary changes.
   *
   *   Unless clean checkout is performed, the server sends to the agent
   *   incremental patches to update only the files changed since the last
   *   build on the agent in the given checkout directory.
   *
   * - **ON_AGENT**: The build agent will check out the sources before the build.
   *
   *   Agent-side checkout frees more server resources and provides the ability
   *   to access version-control-specific directories (.svn, CVS, .git ); that is,
   *   the build script can perform VCS operations (for example, check-ins into
   *   the version control) — in this case ensure the build script uses
   *   credentials necessary for the check-in.
   *
   *   VCS client software has to be installed on the agent
   *   (applicable to Perforce, Mercurial, Git).
   *
   * - **PREFER_ON_AGENT**: With this setting enabled, TeamCity will use the
   *   agent-side checkout (see `ON_AGENT`) if possible.
   *
   *   If the agent-side checkout is not possible, TeamCity will display a
   *   corresponding health report item and will use the server-side checkout
   *   (see the `ON_SERVER`).
   *
   *   TeamCity falls back to the server-side checkout in the following cases:
   *   - No Git or Mercurial client is found on the agent
   *   - The Git or Mercurial client is present on the agent, but is of the wrong version
   *   - The agent has no access to the repository
   *   - If a Perforce client cannot be found on the agent using the same rules
   *     as while performing actual checkout or if stream depot is used and the
   *     checkout rules are complex (other than `. => A`)
   *
   * Defaults to `ON_AGENT`.
   *
   * see: https://www.jetbrains.com/help/teamcity/vcs-checkout-mode.html
   */
  readonly checkoutMode?:
    | "MANUAL"
    | "ON_SERVER"
    | "ON_AGENT"
    | "PREFER_ON_AGENT";

  /**
   * The build checkout directory is a directory on the TeamCity agent machine
   * where all the sources of all builds are checked out into.
   *
   * > HINT: It is strongly advised to leave this value undefined and
   * >       let TeamCity automatically generate this for you.
   *
   * see: https://www.jetbrains.com/help/teamcity/build-checkout-directory.html
   */
  readonly checkoutDirectory?: string;

  /**
   * Delete all files in the checkout directory before the build.
   *
   * Defaults to `true`.
   */
  readonly cleanBuild?: boolean;

  /**
   * Show changes from snapshot dependencies.
   *
   * For a build configuration with snapshot dependencies, you can enable
   * showing of changes from these dependencies transitively.
   *
   * Enabling this setting affects pending changes of a build configuration,
   * builds changes in builds history, the change log and issue log.
   * Changes from dependencies are marked with deps_changes_marker.gif.
   *
   * With this setting enabled, the Schedule Trigger with a "Trigger build
   * only if there are pending changes" option will consider changes from
   * dependencies too.
   *
   * Defaults to `false`.
   *
   * see: https://www.jetbrains.com/help/teamcity/build-dependencies-setup.html#BuildDependenciesSetup-ShowChangesfromDeps
   */
  readonly showDependenciesChanges?: boolean;

  /**
   * Exclude default branch changes from other branches.
   *
   * By default, when displaying pending changes in a feature branch or
   * changes of a build on a branch, TeamCity includes changes in the
   * default branch (till a build in the default branch) as well.
   *
   * This allows tracking the cases when a commit that broke a build was
   * fixed in the default branch, but not in a feature branch.
   *
   * However, for large projects with multiple teams simultaneously working
   * on lots of different branches this means that all the project committers
   * (regardless of the branch they are committing to) will be notified when,
   * for example, a commit in the default branch broke the build or if a force
   * push was performed.
   *
   * If you want to see the changes in a feature branch only, check the box
   * to exclude changes in the default branch from being displayed in other
   * branches.
   *
   * Defaults to `false`.
   *
   * see: https://www.jetbrains.com/help/teamcity/configuring-vcs-settings.html#ConfiguringVCSSettings-excludeDefaultBranch
   */
  readonly excludeDefaultBranchChanges?: boolean;

  /**
   * Limit branches available in this build configuration.
   *
   * Defaults to `+:*`.
   *
   * see: https://www.jetbrains.com/help/teamcity/branch-filter.html
   */
  readonly branchFilter?: string[];

  // END: Version Control Settings
  // START: Failure Conditions

  /**
   * Fail build if it runs longer than the specified limit in minutes.
   *
   * > HINT: 0 means unlimited
   *
   * Defaults to `0`.
   *
   * see: https://www.jetbrains.com/help/teamcity/build-failure-conditions.html
   */
  readonly executionTimeoutMin?: number;

  /**
   * One of build steps exited with an error.
   * e.g non-zero exit code in command line runner.
   *
   * Defaults to `true`.
   *
   * see: https://www.jetbrains.com/help/teamcity/build-failure-conditions.html
   */
  readonly shouldFailBuildOnBadExitCode?: boolean;

  /**
   * At least one test failed.
   *
   * Defaults to `true`.
   *
   * see: https://www.jetbrains.com/help/teamcity/build-failure-conditions.html
   */
  readonly shouldFailBuildIfTestsFailed?: boolean;

  /**
   * Support test retry: successful test run mutes previous test failure.
   *
   * Default to `false`.
   *
   * see: https://www.jetbrains.com/help/teamcity/build-failure-conditions.html#test-retry
   */
  readonly supportTestRetry?: boolean;

  /**
   * An error message is logged by build runner.
   *
   * > HINT: Some processes use stderr to output things like progress
   * >       information and other information which may not necessarily
   * >       mean the process failed.
   *
   * Defaults to `false`.
   *
   * see: https://www.jetbrains.com/help/teamcity/build-failure-conditions.html
   */
  readonly shouldFailBuildOnAnyErrorMessage?: boolean;

  /**
   * An out-of-memory or crash is detected (Java only).
   *
   * Defaults to `false`.
   *
   * see: https://www.jetbrains.com/help/teamcity/build-failure-conditions.html
   */
  readonly shouldFailBuildOnJavaCrash?: boolean;
  // END: Failure Conditions
}

export class BuildOptions extends Construct<BuildOptionsProps, Build> {
  constructor(scope: Build, props: BuildOptionsProps) {
    super(scope, props);
    if (typeof scope.options !== "undefined") {
      throw new Error("BuildOptions is a singleton");
    }
    // deno-lint-ignore no-explicit-any
    (scope as any).options = this;
    scope["_addXmlBuilder"](BuildOptions, (x) => x.Node(this.toXml()));
  }

  toXml(): XmlElement {
    return new XmlElement("options", (x) => {
      if (typeof this.props.buildConfigurationType !== "undefined") {
        if (this.props.buildConfigurationType !== "REGULAR") {
          x.Node("option", {
            name: "buildConfigurationType",
            value: this.props.buildConfigurationType,
          });
        }
      }

      x.Node("option", {
        name: "buildNumberPattern",
        value: this.props.buildNumberFormat ?? "%build.counter%",
      });

      if (typeof this.props.publishArtifacts !== "undefined") {
        if (this.props.publishArtifacts !== "EVEN_FAILURES") {
          x.Node("option", {
            name: "publishArtifactCondition",
            value: this.props.publishArtifacts,
          });
        }
      }

      if (typeof this.props.artifactPaths !== "undefined") {
        if (this.props.artifactPaths.length > 0) {
          x.Node(
            "option",
            { name: "artifactRules" },
            (x) => x.CDATA(this.props.artifactPaths!.join("\n")),
          );
        }
      }

      x.Node("option", {
        name: "enableHangingBuildsDetection",
        value: (this.props.enableHangingBuildsDetection ?? false)
          ? "true"
          : "false",
      });

      x.Node("option", {
        name: "allowPersonalBuildTriggering",
        value: (this.props.allowTriggeringPersonalBuilds ?? false)
          ? "true"
          : "false",
      });

      x.Node("option", {
        name: "allowExternalStatus",
        value: (this.props.enableStatusWidget ?? true) ? "true" : "false",
      });

      x.Node("option", {
        name: "maximumNumberOfBuilds",
        value: (this.props.maximumNumberOfBuilds ?? 0).toString(),
      });

      const checkoutMode = this.props.checkoutMode ?? "ON_AGENT";
      if (checkoutMode !== "PREFER_ON_AGENT") {
        x.Node("option", {
          name: "checkoutMode",
          value: checkoutMode,
        });
      }

      if (typeof this.props.checkoutDirectory !== "undefined") {
        x.Node("option", {
          name: "checkoutDirectory",
          value: this.props.checkoutDirectory,
        });
      }

      x.Node("option", {
        name: "cleanBuild",
        value: (this.props.cleanBuild ?? true) ? "true" : "false",
      });

      x.Node("option", {
        name: "showDependenciesChanges",
        value: (this.props.showDependenciesChanges ?? false) ? "true" : "false",
      });

      x.Node("option", {
        name: "excludeDefaultBranchChanges",
        value: (this.props.excludeDefaultBranchChanges ?? false)
          ? "true"
          : "false",
      });

      x.Node(
        "option",
        { name: "branchFilter" },
        (x) => x.CDATA((this.props.branchFilter ?? ["+:*"]).join("\n")),
      );

      x.Node("option", {
        name: "excludeDefaultBranchChanges",
        value: (this.props.executionTimeoutMin ?? 0).toString(),
      });

      x.Node("option", {
        name: "shouldFailBuildOnBadExitCode",
        value: (this.props.shouldFailBuildOnBadExitCode ?? true)
          ? "true"
          : "false",
      });

      x.Node("option", {
        name: "shouldFailBuildIfTestsFailed",
        value: (this.props.shouldFailBuildIfTestsFailed ?? true)
          ? "true"
          : "false",
      });

      x.Node("option", {
        name: "supportTestRetry",
        value: (this.props.supportTestRetry ?? false) ? "true" : "false",
      });

      x.Node("option", {
        name: "shouldFailBuildOnAnyErrorMessage",
        value: (this.props.shouldFailBuildOnAnyErrorMessage ?? false)
          ? "true"
          : "false",
      });

      x.Node("option", {
        name: "shouldFailBuildOnJavaCrash",
        value: (this.props.shouldFailBuildOnJavaCrash ?? false)
          ? "true"
          : "false",
      });
    });
  }
}

declare module "./build.ts" {
  interface Build {
    /**
     * Additional options for a Build.
     */
    readonly options?: BuildOptions;

    /**
     * Configures additional options for a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.Options({ ... });
     *  });
     * });
     * ```
     */
    Options(props: BuildOptionsProps): BuildOptions;
  }
}

Build.prototype.Options = function (this: Build, props: BuildOptionsProps) {
  return new BuildOptions(this, props);
};
