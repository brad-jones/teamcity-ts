import { Project } from "../project/project.ts";
import { XmlDocument } from "../xml.ts";
import { AuthMethod } from "./auth_methods/auth_method.ts";
import { BaseVcsRoot, BaseVcsRootProps } from "./base_vcs_root.ts";

export interface GitVcsRootProps extends BaseVcsRootProps {
  /**
   * The URL of the remote Git repository used for fetching data from the repository.
   */
  readonly url: string;

  /**
   * The authentication method that TeamCity will use to interact with the repo.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/git.html#Authentication+Settings
   */
  readonly auth: AuthMethod;

  /**
   * The URL of the target remote Git repository used for pushing annotated
   * tags created via VCS labeling build feature to the remote repository.
   * If blank, the fetch URL is used.
   */
  pushUrl?: string;

  /**
   * Configures default branch. Parameter references are supported here.
   *
   * Defaults to: `refs/heads/master`
   */
  branch?: string;

  /**
   * Lists the patterns for branch names, required for feature branches support.
   * The matched branches are monitored for changes in addition to the default branch.
   *
   * The syntax is similar to checkout rules: +|-:branch_name, where branch_name
   * is specific to the VCS, i.e. refs/heads/ in Git (with the optional * placeholder).
   */
  branchSpec?: string[];

  /**
   * Allows monitoring / checking out git tags as branches making branch
   * specification match tag names as well as branches.
   *
   * For example: `+|-:refs/tags/<tag_name>`
   *
   * Defaults to: `false`.
   */
  reportTagRevisions?: boolean;

  /**
   * Defines a way TeamCity reports username for a VCS change.
   *
   * Changing the username style will affect only newly collected changes.
   * Old changes will continue to be stored with the style that was active
   * at the time of collecting changes.
   *
   * Defaults to: `USERID`.
   */
  usernameStyle?: "FULL" | "NAME" | "USERID" | "EMAIL";

  /**
   * Select whether you want to ignore the submodules, or treat them as a part
   * of the source tree. Submodule repositories should either not require
   * authentication or use the same protocol and accept the same authentication
   * as configured in the VCS root.
   *
   * Defaults to: `false`.
   */
  submoduleCheckout?: boolean;

  /**
   * A custom username used for labeling.
   *
   * Format: `Username <email>`
   *
   * This is essentially setting: `user.name` & `user.email`
   * TeamCity will use this identity for any commits it
   * makes back to this repo.
   */
  userForTags?: string;

  /**
   * Convert line-endings of all text files to CRLF (works as setting
   * `core.autocrlf=true` in a repository config).
   *
   * When not selected, no line-endings conversion is performed (works as
   * setting `core.autocrlf=false`).
   *
   * Affects the server-side checkout only.
   *
   * A change to this property causes a clean checkout.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/git.html#Server+Settings
   *
   * Defaults to: `false`.
   */
  serverSideAutoCrlf?: boolean;

  /**
   * Provide the path to a Git executable to be used on the agent.
   *
   * When set to `%env.TEAMCITY_GIT_PATH%`, the automatically detected
   * Git will be used.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/git.html#agentGitPath
   */
  agentGitPath?: string;

  /**
   * Specify here when the `git clean` command is to run on the agent,
   * and which files are to be removed.
   *
   * If a build configuration depends on multiple VCS roots, we suggest that
   * you configure separate agent checkout directories for each of these roots,
   * using VCS checkout rules.
   *
   * This way, `git clean` will never delete these checkout directories during cleaning.
   *
   * Defaults to: `ALWAYS`.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/git.html#GitAgentSettings
   */
  agentCleanPolicy?: "ALWAYS" | "NEVER" | "ON_BRANCH_CHANGE";

  /**
   * This option specifies which files will be removed when `git clean` command is run on agent.
   *
   * Defaults to: `ALL_UNTRACKED`.
   */
  agentCleanFilesPolicy?:
    | "ALL_UNTRACKED"
    | "IGNORED_ONLY"
    | "NON_IGNORED_ONLY";

  /**
   * It is recommended to always leave this option enabled.
   *
   * When enabled (default), TeamCity clones the Git repository and creates its
   * mirror under the agent's `system\git` directory. TeamCity uses this mirror
   * as an alternate repository when updating the checkout directory for a build.
   *
   * This speeds up clean checkout (because only the build working directory is
   * cleaned) and saves disk space (as the mirror is the only clone of the given
   * Git repository on an agent).
   *
   * If you disable this option, TeamCity will clone the repository directly
   * under the build's working directory, unless the `teamcity.git.use.local.mirrors`
   * property is set to `true`.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/git.html#Git+mirrors+on+cloud+agents
   */
  useAlternates?: boolean;

  /**
   * Specifies how often TeamCity polls the VCS repository for VCS changes.
   *
   * By default, the global predefined server setting is used that can be
   * modified on the `Administration | Global Settings` page.
   *
   * The interval time starts as soon as the last poll is finished on the
   * per-VCS root basis. Here you can specify a custom interval for the
   * current VCS root.
   *
   * Some public servers may block access if polled too frequently.
   *
   * If TeamCity detects that a VCS commit hook is used to trigger checking for
   * changes, this interval is automatically increased up to the predefined
   * value (4 hours).
   *
   * If the periodical check finds changes undetected via the commit hook,
   * the polling interval is reset to the specified minimum.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/configuring-vcs-roots.html#Common+VCS+Root+Properties
   * also: https://www.jetbrains.com/help/teamcity/2020.2/configuring-vcs-post-commit-hooks-for-teamcity.html
   */
  modificationCheckInterval?: number;

  /**
   * TODO: Strange this appears in the XML but no where in the docs or in the
   * UI as far as I can tell. Perhaps an old deprecated feature? I mean who
   * would set this to true anyway...
   */
  ignoreKnownHosts?: boolean;
}

/**
 * Uses git as the version control system.
 *
 * see: https://www.jetbrains.com/help/teamcity/2020.2/git.html
 */
export class GitVcsRoot extends BaseVcsRoot<GitVcsRootProps> {
  constructor(scope: Project, props: GitVcsRootProps) {
    super(scope, props);
  }

  toXml(): XmlDocument {
    return this._baseToXml("jetbrains.git", (x) => {
      if (typeof this.props.modificationCheckInterval !== "undefined") {
        x.Node(
          "modification-check-interval",
          this.props.modificationCheckInterval.toString(),
        );
      }

      x.Node("param", { name: "url", value: this.props.url });

      if (typeof this.props.pushUrl !== "undefined") {
        x.Node("param", { name: "pushUrl", value: this.props.pushUrl });
      }

      x.Node("param", {
        name: "branch",
        value: this.props.branch ?? "refs/heads/master",
      });

      if (typeof this.props.branchSpec !== "undefined") {
        x.Node(
          "param",
          { name: "teamcity:branchSpec" },
          (x) => x.CDATA(this.props.branchSpec!.join("\n")),
        );
      }

      x.Node("param", {
        name: "reportTagRevisions",
        value: (this.props.reportTagRevisions ?? false) ? "true" : "false",
      });

      x.Node("param", {
        name: "usernameStyle",
        value: this.props.usernameStyle ?? "USERID",
      });

      x.Node("param", {
        name: "submoduleCheckout",
        value: (this.props.submoduleCheckout ?? false) ? "true" : "false",
      });

      if (typeof this.props.userForTags !== "undefined") {
        x.Node("param", {
          name: "userForTags",
          value: this.props.userForTags,
        });
      }

      x.Node("param", {
        name: "serverSideAutoCrlf",
        value: (this.props.serverSideAutoCrlf ?? false) ? "true" : "false",
      });

      if (typeof this.props.agentGitPath !== "undefined") {
        x.Node("param", {
          name: "agentGitPath",
          value: this.props.agentGitPath,
        });
      }

      x.Node("param", {
        name: "agentCleanPolicy",
        value: this.props.agentCleanPolicy ?? "ALWAYS",
      });

      x.Node("param", {
        name: "agentCleanFilesPolicy",
        value: this.props.agentCleanFilesPolicy ?? "ALL_UNTRACKED",
      });

      if (typeof this.props.useAlternates !== "undefined") {
        x.Node("param", {
          name: "useAlternates",
          value: this.props.useAlternates ? "true" : "false",
        });
      } else {
        x.Node("param", {
          name: "useAlternates",
          value: "true",
        });
      }

      /**
       * TODO: Strange this appears in the XML but no where in the docs or in
       * the UI as far as I can tell. Perhaps an old deprecated feature?
       * I mean who would set this to true anyway...
       */
      x.Node("param", {
        name: "ignoreKnownHosts",
        value: (this.props.ignoreKnownHosts ?? false) ? "true" : "false",
      });

      x.Node("param", {
        name: "authMethod",
        value: this.props.auth.type,
      });

      // deno-lint-ignore no-explicit-any
      const username = (this.props.auth as any).username as
        | string
        | undefined;
      if (typeof username === "string") {
        x.Node("param", {
          name: "username",
          value: username,
        });
      }

      switch (this.props.auth.type) {
        case "ANONYMOUS":
        case "PRIVATE_KEY_DEFAULT":
          // nothing to do here
          break;
        case "PASSWORD":
          x.Node("param", {
            name: "secure:password",
            value: this.props.auth.secret,
          });
          break;
        case "PRIVATE_KEY_FILE":
          x.Node("param", {
            name: "privateKeyPath",
            value: this.props.auth.path,
          });
          if (typeof this.props.auth.passphrase !== "undefined") {
            x.Node("param", {
              name: "secure:passphrase",
              value: this.props.auth.passphrase,
            });
          }
          break;
        case "TEAMCITY_SSH_KEY":
          x.Node("param", {
            name: "teamcitySshKey",
            value: this.props.auth.keyName,
          });
          break;
        default:
          throw new Error("unsupported auth type");
      }
    });
  }
}

declare module "../project/project.ts" {
  interface Project {
    /**
     * Adds a new GitVcsRoot to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.GitVcsRoot({ });
     * });
     * ```
     */
    GitVcsRoot(props: GitVcsRootProps): GitVcsRoot;
  }
}

Project.prototype.GitVcsRoot = function (
  this: Project,
  props: GitVcsRootProps,
) {
  return new GitVcsRoot(this, props);
};
