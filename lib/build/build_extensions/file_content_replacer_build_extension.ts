import { Build } from "../build.ts";
import { AllXOR } from "../../types.ts";
import { XmlElement } from "../../xml.ts";
import {
  BaseBuildExtension,
  BaseBuildExtensionProps,
} from "./base_build_extension.ts";

export interface FileContentReplacerBuildExtensionProps
  extends BaseBuildExtensionProps {
  /**
   * Specify paths to files where the values to be replaced will be searched.
   *
   * Rules are in the form of `+|-:[path relative to the checkout directory]`.
   * Ant-like wildcards are supported, for example, `dir/*.cs`.
   *
   * > HINT: Here, the pipe symbol `|` represents the **OR** command,
   * >       as in regular expressions: use `+` for including, OR `-`
   * >       for excluding.
   *
   * see: https://www.jetbrains.com/help/teamcity/file-content-replacer.html#File+Content+Replacer+Settings
   */
  processFiles: string[];

  /**
   * Disable this option to prevent build failure even if no files match the
   * specified pattern.
   *
   * Defaults to `true`.
   */
  failBuild?: boolean;

  /**
   * The file encoding of the files that are being search and replaced.
   *
   * > HINT: If left undefined TeamCity will just aut detect this
   * >       and most of the time probably work just fine.
   *
   * see: https://www.jetbrains.com/help/teamcity/file-content-replacer.html#File+Content+Replacer+Settings
   */
  encoding?:
    | "US-ASCII"
    | "UTF-8"
    | "UTF-16BE"
    | "UTF-16LE"
    | {
      /**
       * When specifying a custom encoding, make sure it is supported by the agent.
       *
       * see: https://docs.oracle.com/javase/8/docs/technotes/guides/intl/encoding.doc.html
       */
      custom: string;
    };

  /**
   * You have 3 options for the actual search and replace logic.
   *
   * - fixedStrings: Where you provide a simple exact search and replace values,
   *   no regex is used at all.
   *
   * - regex: Both the search and replace values are treated as regex patterns.
   *
   * - mixed: Where the search pattern is treated as regex but the replacement
   *   is a static string.
   */
  regexMode: AllXOR<[
    {
      fixedStrings: {
        /**
         * Pattern to search for. Interpreted literally.
         */
        search: string;

        /**
         * Replacement text. Backslashes (\) and dollar signs ($) have no special meaning.
         */
        replace: string;
      };
    },
    {
      regex: {
        /**
         * Pattern to search for, in the regular expression format.
         *
         * **MULTILINE** mode is on by default. To disable it,
         * start the pattern with `(?-m)`.
         *
         * see: https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html#sum
         */
        search: string;

        /**
         * Replacement text. $N sequence references N-th capturing group.
         * All backslashes (\) and dollar signs ($) without a special meaning
         * should be quoted (as \\ and \$, respectively).
         */
        replace: string;
      };
    },
    {
      mixed: {
        /**
         * Pattern to search for, in the regular expression format.
         *
         * **MULTILINE** mode is on by default. To disable it,
         * start the pattern with `(?-m)`.
         *
         * see: https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html#sum
         */
        search: string;

        /**
         * Replacement text. Backslashes (\) and dollar signs ($) have no special meaning.
         */
        replace: string;
      };
    },
  ]>;

  /**
   * Disable for case-insensitive languages (e.g. Visual Basic).
   *
   * Defaults to `true`.
   */
  matchCase?: boolean;
}

/**
 * File Content Replacer is the build feature which processes text files by
 * performing regular expression replacements before a build. After the build,
 * it restores the file content to the original state.
 *
 * > HINT: File Content Replacer should be used with the automatic checkout
 * > only: after this build feature is configured, it will run before the
 * > first build step. TeamCity will first perform replacement in the
 * > specified files found in the build checkout directory and then run
 * > your build.
 *
 * see: https://www.jetbrains.com/help/teamcity/file-content-replacer.html
 */
export class FileContentReplacerBuildExtension
  extends BaseBuildExtension<FileContentReplacerBuildExtensionProps> {
  constructor(scope: Build, props: FileContentReplacerBuildExtensionProps) {
    super(scope, props);
  }

  toXml(): XmlElement {
    return this._baseToXml("JetBrains.FileContentReplacer", (x) => {
      x.Node("parameters", (x) => {
        x.Node(
          "param",
          { name: "teamcity.file.content.replacer.wildcards" },
          (x) => x.CDATA(this.props.processFiles.join("\n")),
        );

        x.Node("param", {
          name: "teamcity.file.content.replacer.failBuild",
          value: (this.props.failBuild ?? true) ? "true" : "false",
        });

        if (typeof this.props.encoding === "undefined") {
          x.Node("param", {
            name: "teamcity.file.content.replacer.file.encoding",
            value: "autodetect",
          });
          x.Node("param", {
            name: "teamcity.file.content.replacer.file.encoding.custom",
            value: "autodetect",
          });
        } else {
          if (typeof this.props.encoding === "string") {
            x.Node("param", {
              name: "teamcity.file.content.replacer.file.encoding",
              value: this.props.encoding,
            });
            x.Node("param", {
              name: "teamcity.file.content.replacer.file.encoding.custom",
              value: this.props.encoding,
            });
          } else {
            x.Node("param", {
              name: "teamcity.file.content.replacer.file.encoding",
              value: "custom",
            });
            x.Node("param", {
              name: "teamcity.file.content.replacer.file.encoding.custom",
              value: this.props.encoding.custom,
            });
          }
        }

        if (typeof this.props.regexMode.fixedStrings === "object") {
          x.Node("param", {
            name: "teamcity.file.content.replacer.regexMode",
            value: "FIXED_STRINGS",
          });
          x.Node("param", {
            name: "teamcity.file.content.replacer.pattern",
            value: this.props.regexMode.fixedStrings.search,
          });
          x.Node(
            "param",
            { name: "teamcity.file.content.replacer.replacement" },
            this.props.regexMode.fixedStrings.replace,
          );
        } else {
          if (typeof this.props.regexMode.regex === "object") {
            x.Node("param", {
              name: "teamcity.file.content.replacer.regexMode",
              value: "REGEX",
            });
            x.Node("param", {
              name: "teamcity.file.content.replacer.pattern",
              value: this.props.regexMode.regex.search,
            });
            x.Node(
              "param",
              { name: "teamcity.file.content.replacer.replacement" },
              this.props.regexMode.regex.replace,
            );
          } else {
            if (typeof this.props.regexMode.mixed === "object") {
              x.Node("param", {
                name: "teamcity.file.content.replacer.regexMode",
                value: "REGEX_MIXED",
              });
              x.Node("param", {
                name: "teamcity.file.content.replacer.pattern",
                value: this.props.regexMode.mixed.search,
              });
              x.Node(
                "param",
                { name: "teamcity.file.content.replacer.replacement" },
                this.props.regexMode.mixed.replace,
              );
            } else {
              throw new Error("unexpected this.props.regexMode object");
            }
          }
        }

        x.Node("param", {
          name: "teamcity.file.content.replacer.pattern.case.sensitive",
          value: (this.props.matchCase ?? true) ? "true" : "false",
        });
      });
    });
  }
}

declare module "../build.ts" {
  interface Build {
    /**
     * Adds a new FileContentReplacerBuildExtension to a Build.
     *
     * ```ts
     * new Project({ id: "MyPipeline" }, (p) => {
     *  p.Build({ id: "MyBuildConfiguration" }, (b) => {
     *    b.FileContentReplacerExtension({ ... });
     *  });
     * });
     * ```
     */
    FileContentReplacerExtension(
      props: FileContentReplacerBuildExtensionProps,
    ): FileContentReplacerBuildExtension;
  }
}

Build.prototype.FileContentReplacerExtension = function (
  this: Build,
  props: FileContentReplacerBuildExtensionProps,
) {
  return new FileContentReplacerBuildExtension(this, props);
};
