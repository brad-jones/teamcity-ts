import { XmlElement } from "../../xml.ts";
import { Project } from "../project.ts";
import {
  BaseProjectExtension,
  BaseProjectExtensionProps,
} from "./base_project_extension.ts";

export interface VersionedSettingsProjectExtensionProps
  extends BaseProjectExtensionProps {
  /**
   * The ID of a VcsRoot that will be used to synchronize settings with.
   *
   * > HINT: Yes you could have a totally different repo or branch that
   * >       contained the `.teamcity` folder if so inclined...
   */
  readonly vscRootID: string;

  /**
   * Enable or disable synchronization.
   *
   * Defaults to `true`.
   */
  enabled?: boolean;

  /**
   * There are two possible sources of build settings:
   *
   * (1) the current settings on the TeamCity server, that is the latest settings'
   *     changes applied to the server (either made via the UI, or via a commit
   *     to the .teamcity directory in the VCS root), and
   *
   * (2) the settings in the VCS on the revision selected for a build.
   *
   * Therefore, it is possible to start builds with settings different from those
   * currently defined in the build configuration. For projects with enabled
   * versioned settings, you can instruct TeamCity which settings to take when
   * build starts.
   *
   * The 3 modes:
   *
   * `ALWAYS_USE_CURRENT`: all builds use current project settings from the
   * TeamCity server. Settings' changes in branches, history, and personal
   * builds are ignored. Users cannot run a build with custom project settings.
   *
   * `PREFER_CURRENT`: a build uses the latest project settings from the TeamCity
   * server. Users can run a build with older project settings via the custom
   * build dialog.
   *
   * `PREFER_VCS`: builds in branches and history builds, which use settings
   * from VCS, load settings from the versioned settings' revision calculated
   * for the build. Users can change configuration settings in personal builds
   * from IDE or can run a build with project settings current on the TeamCity
   * server via the custom build dialog.
   *
   * Defaults to `PREFER_VCS`.
   *
   * see: https://www.jetbrains.com/help/teamcity/2020.2/storing-project-settings-in-version-control.html#StoringProjectSettingsinVersionControl-DefiningSettingstoApplytoBuilds
   */
  mode?: "ALWAYS_USE_CURRENT" | "PREFER_CURRENT" | "PREFER_VCS";

  /**
   * Show settings changes in builds.
   *
   * Defaults to `true`.
   */
  showChanges?: boolean;

  /**
   * Store secure values (like passwords or API tokens) outside of VCS.
   *
   * Defaults to `true`.
   */
  useCredentialsJSON?: boolean;

  /**
   * The format in which the Settings are stored.
   *
   * Obviously this tool doesn't support kotlin in anyway shape or form.
   * None the less for the sake of completeness here is the property.
   *
   * Defaults to `xml`.
   */
  format?: "xml" | "kotlin" | {
    kotlin: true;

    /**
     * One of the advantages of the portable DSL script is that the script can
     * be used by more than one project on the same server or more than one
     * server (hence the name: portable).
     *
     * Defaults to `true`.
     *
     * see: https://www.jetbrains.com/help/teamcity/2020.2/kotlin-dsl.html#Sharing+Kotlin+DSL+Scripts
     * also: https://www.jetbrains.com/help/teamcity/2020.2/kotlin-dsl.html#Non-Portable+DSL
     */
    generatePortableDSL?: boolean;

    /**
     * Since TeamCity 2019.2, you can customize the DSL generation behavior using
     * context parameters configured in the TeamCity UI. Context parameters are
     * specified as a part of the project versioned settings in the UI.
     *
     * > HINT: Context parameters are a Kotlin only thing, XML configuration
     * > can not & does not need to use context parameters. And since this
     * > project generates XML this is also essentially useless but here for
     * > the sake of completeness.
     *
     * see: https://www.jetbrains.com/help/teamcity/2020.2/kotlin-dsl.html#Using+Context+Parameters+in+DSL
     */
    context?: Record<string, string>;
  };
}

/**
 * TeamCity allows the two-way synchronization of the project settings with
 * the version control repository. Supported VCSs are Git, Mercurial, Perforce,
 * Subversion, and Azure DevOps Server (formerly TFS).
 *
 * You can store settings in the XML format or in the Kotlin language and
 * define settings programmatically using the Kotlin-based DSL.
 *
 * > HINT: Or in this case we will be keeping our settings in YAML/JSON
 * >       or maybe even TypeScript files & then generating that into XML.
 * >       The entire premise behind this very project.
 *
 * see: https://www.jetbrains.com/help/teamcity/2020.2/storing-project-settings-in-version-control.html
 */
export class VersionedSettingsProjectExtension
  extends BaseProjectExtension<VersionedSettingsProjectExtensionProps> {
  constructor(scope: Project, props: VersionedSettingsProjectExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return new XmlElement(
      "extension",
      { id: this.props.id, type: "versionedSettings" },
      (x) => {
        x.Node("param", {
          name: "enabled",
          value: (this.props.enabled ?? true) ? "true" : "false",
        });

        x.Node("param", {
          name: "rootId",
          value: this.props.vscRootID,
        });

        x.Node("param", {
          name: "buildSettings",
          value: this.props.mode ?? "PREFER_VCS",
        });

        x.Node("param", {
          name: "showChanges",
          value: (this.props.showChanges ?? true) ? "true" : "false",
        });

        if (this.props.useCredentialsJSON ?? true) {
          x.Node("param", {
            name: "credentialsStorageType",
            value: "credentialsJSON",
          });
        }

        const format = this.props.format ?? "xml";
        if (format === "kotlin") {
          x.Node("param", { "name": "format", "value": "kotlin" });
          x.Node("param", { "name": "useRelativeIds", "value": "true" });
        } else {
          if (typeof format === "object") {
            x.Node("param", { "name": "format", "value": "kotlin" });

            x.Node("param", {
              "name": "useRelativeIds",
              "value": (format.generatePortableDSL ?? true) ? "true" : "false",
            });

            for (const [k, v] of Object.entries(format.context ?? {})) {
              x.Node("param", { "name": `context.${k}`, "value": v });
            }
          }
        }
      },
    );
  }
}

declare module "../project.ts" {
  interface Project {
    /**
     * Adds a new VersionedSettingsProjectExtension to a Project.
     *
     * ```ts
     * new Project({id: "MyPipeline"}, (p) => {
     *  p.VersionedSettings({ });
     * });
     * ```
     */
    VersionedSettings(
      props: VersionedSettingsProjectExtensionProps,
    ): VersionedSettingsProjectExtension;
  }
}

Project.prototype.VersionedSettings = function (
  this: Project,
  props: VersionedSettingsProjectExtensionProps,
) {
  return new VersionedSettingsProjectExtension(this, props);
};
