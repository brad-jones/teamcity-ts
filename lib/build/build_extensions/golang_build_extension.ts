import { Build } from "../build.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

// deno-lint-ignore no-empty-interface
export interface GolangBuildExtensionProps extends BaseBuildExtensionProps {}

/**
 * The Golang build feature enables the real-time reporting and history of
 * Go test results in TeamCity.
 *
 * Before running builds, make sure a Go compiler is installed on an agent.
 *
 * To enable Go tests reporting in TeamCity, run them with the `-json` flag
 * using one of these two methods:
 *
 * - Add this flag to the Command Line build runner's script: `go test -json`.
 * - Add the `env.GOFLAGS = -json` parameter to the build configuration.
 *
 * see: https://www.jetbrains.com/help/teamcity/golang.html
 */
export class GolangBuildExtension
  extends BaseBuildExtension<GolangBuildExtensionProps> {
  constructor(scope: Build, props: GolangBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("golang", (x) => {
      x.Node("parameters", (x) => {
        x.Node("param", { name: "test.format", value: "json" });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new GolangBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.GolangExtension({ ... });
     *  });
     * });
     * ```
     */
    GolangExtension(
      props: GolangBuildExtensionProps,
    ): GolangBuildExtension;
  }
}

Build.prototype.GolangExtension = function (
  this: Build,
  props: GolangBuildExtensionProps,
) {
  return new GolangBuildExtension(this, props);
};
