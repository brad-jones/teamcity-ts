import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface SshAgentBuildExtensionProps extends BaseBuildExtensionProps {
  /**
   * The name of a uploaded ssh key.
   *
   * > HINT: SSH Keys are uploaded in the project settings. You can not define
   * >       the actual SSH key in this config anywhere, in this respect SSH keys
   * >       are similar to credentialsJSON pointers.
   *
   * see: https://www.jetbrains.com/help/teamcity/ssh-keys-management.html
   */
  keyName: string;
}

/**
 * The SSH Agent build feature runs an SSH agent with the selected uploaded
 * SSH key during a build. When your build script runs an SSH client, it uses
 * the SSH agent with the loaded key.
 *
 * see: https://www.jetbrains.com/help/teamcity/ssh-agent.html
 */
export class SshAgentBuildExtension
  extends BaseBuildExtension<SshAgentBuildExtensionProps> {
  constructor(scope: Build, props: SshAgentBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("ssh-agent-build-feature", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", { name: "teamcitySshKey", value: this.props.keyName });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new SshAgentBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.SshAgentExtension({ ... });
     *  });
     * });
     * ```
     */
    SshAgentExtension(
      props: SshAgentBuildExtensionProps,
    ): SshAgentBuildExtension;
  }
}

Build.prototype.SshAgentExtension = function (
  this: Build,
  props: SshAgentBuildExtensionProps,
) {
  return new SshAgentBuildExtension(this, props);
};
