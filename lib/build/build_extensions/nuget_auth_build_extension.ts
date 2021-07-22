import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface NugetAuthBuildExtensionProps extends BaseBuildExtensionProps {
  /**
   * The Nuget Source URL to authenticate against.
   */
  source: string;

  /**
   * The username for the Nuget Source URL.
   */
  username: string;

  /**
   * The password for the Nuget Source URL.
   *
   * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
   * > here, instead preferring a password parameter you can still do that but
   * > you will have to cast the string. This is hard on purpose, you should
   * > always prefer `credentialsJSON` over a parameter with a password spec.
   */
  password: `credentialsJSON:${string}`;
}

/**
 * When using NuGet packages from an external authenticated feed during a
 * build on TeamCity, the credentials for connecting to that feed have to
 * be specified.
 *
 * Adding this information to source control is not a secure practice,
 * so TeamCity provides the NuGet Feed Credentials build feature which
 * allows interacting with feeds that require authentication.
 *
 * > HINT: Only NuGet 2.0+ is supported!
 *
 * see: https://www.jetbrains.com/help/teamcity/nuget-feed-credentials.html
 */
export class NugetAuthBuildExtension
  extends BaseBuildExtension<NugetAuthBuildExtensionProps> {
  constructor(scope: Build, props: NugetAuthBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("jb.nuget.auth", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", { name: "nuget.auth.feed", value: this.props.source });
        x.Node("param", {
          name: "nuget.auth.username",
          value: this.props.username,
        });
        x.Node("param", {
          name: "secure:nuget.auth.password",
          value: this.props.password,
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new NugetAuthBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.NugetAuthExtension({ ... });
     *  });
     * });
     * ```
     */
    NugetAuthExtension(
      props: NugetAuthBuildExtensionProps,
    ): NugetAuthBuildExtension;
  }
}

Build.prototype.NugetAuthExtension = function (
  this: Build,
  props: NugetAuthBuildExtensionProps,
) {
  return new NugetAuthBuildExtension(this, props);
};
