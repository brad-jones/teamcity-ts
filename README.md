# teamcity-ts

**TLDR:** This is a [TypeScript](https://www.typescriptlang.org/) SDK for
building [TeamCity](https://www.jetbrains.com/teamcity/) pipelines, instead of
using [Kotlin](https://www.jetbrains.com/help/teamcity/kotlin-dsl.html) or
[XML](https://www.w3.org/XML/).

```ts
import { Project } from "https://deno.land/x/teamcity-ts/mod.ts";

const myPipeline = new Project({ id: "MyPipeline" }, (p) => {
  const host = p.Parameter({ name: "host", value: "1.1.1.1" });

  p.Build({ id: "MyBuild" }, (b) => {
    const count = b.Parameter({ name: "count", value: "3" });

    b.CommandLineRunner({
      id: "MyStep",
      cmd: "ping",
      args: ["-c", `${count}`, `${host}`],
      executionPolicy: "default",
    });
  });
});
```

> HINT: This SDK targets [Deno](https://deno.land).
> [Node.js](https://nodejs.org) support may be possible in the future...

## Usage

This SDK is primarily concerned with the generation of the XML & does not
provide any further infrastructure to get that XML into the right place at the
right time.

Given the above example, it is up to you to do something like this:

```ts
const jobs = [];
for (const [filename, doc] of Object.entries(myPipeline.toXml())) {
  jobs.push(Deno.writeTextFile(filename, doc.toString(true)));
}
await Promise.all(jobs);
```

`filename` will always begin with `.teamcity/` so assuming you tacked the above
on to the example & ran it from the root of your repo you would get the expected
outcome, that is the following files would be written:

- `./.teamcity/MyPipeline/project-config.xml`
- `./.teamcity/MyPipeline/buildTypes/MyBuild.xml`

For a more complete solution checkout <https://github.com/brad-jones/axe>

## Why not Kotlin?

- The TeamCity Kotlin DSL documentation has poor coverage.
- Outside of Java/Android circles, Kotlin as a language is not super well known.
- The tooling ([VsCode Extension](https://github.com/fwcd/vscode-kotlin) /
  [Language Server](https://github.com/fwcd/kotlin-language-server)) for Kotlin
  is buggy/not very mature.
  - IMO Jetbrains IDEs are bloatware.

## Why TypeScript?

- Through a
  [painstaking process](https://github.com/brad-jones/teamcity-playground) this
  TypeScript DSL is thoroughly documented & refers to the existing documentation
  for the TeamCity UI.

- JavaScript & by extension TypeScript is one of the most ubiquitous languages
  on the planet. Other projects like the
  [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html) have
  successfully built similar, arguably much more complex, yet accessible DSLs on
  top of TypeScript.

- The tooling for JavaScript/TypeScript is leaps and bounds ahead of the Kotlin
  developer experience.

_read more:
[./docs/dsl-design.md](https://github.com/brad-jones/teamcity-ts/master/blob/docs/dsl-design.md)_

## DSL Coverage

I'll be up front right now that I haven't modeled every thing TeamCity provides,
only the things that I think are going to matter most but the DSL has escape
hatches, similar to the likes of the
[CDK](https://docs.aws.amazon.com/cdk/latest/guide/cfn_layer.html), so if there
is some obscure TeamCity feature that is not modeled, this DSL should still
allow you define it in a type safe manner & not stand in your way.

_read more:
[./docs/extending.md](https://github.com/brad-jones/teamcity-ts/master/blob/docs/extending.md)_

| Construct                                                         | Status                         |
| ----------------------------------------------------------------- | ------------------------------ |
| Build                                                             | :heavy_check_mark:             |
| Build / Dependencies                                              | :x:                            |
| Build / Extensions / Agent Free Space                             | :heavy_check_mark:             |
| Build / Extensions / Assembly Info                                | :heavy_check_mark:             |
| Build / Extensions / Auto Merge                                   | :heavy_check_mark:             |
| Build / Extensions / Commit Status Publishers / Atlassian Stash   | :x:                            |
| Build / Extensions / Commit Status Publishers / Bitbucket Cloud   | :x:                            |
| Build / Extensions / Commit Status Publishers / Gerrit            | :x:                            |
| Build / Extensions / Commit Status Publishers / Github            | :heavy_check_mark:             |
| Build / Extensions / Commit Status Publishers / Gitlab            | :x:                            |
| Build / Extensions / Commit Status Publishers / Jetbrains Space   | :x:                            |
| Build / Extensions / Commit Status Publishers / Tfs (AzureDevOps) | :x:                            |
| Build / Extensions / Commit Status Publishers / Upsource          | :x:                            |
| Build / Extensions / Docker Support                               | :heavy_check_mark:             |
| Build / Extensions / Failure on Message                           | :heavy_check_mark:             |
| Build / Extensions / Failure on Metric                            | :heavy_check_mark:             |
| Build / Extensions / File Content Replacer                        | :heavy_check_mark:             |
| Build / Extensions / Golang                                       | :heavy_check_mark:             |
| Build / Extensions / Investigations Auto Assigner                 | :heavy_check_mark:             |
| Build / Extensions / Jira Cloud                                   | :heavy_check_mark:             |
| Build / Extensions / Keep Rules                                   | :heavy_check_mark:             |
| Build / Extensions / Notifiers / Email                            | :heavy_check_mark:             |
| Build / Extensions / Notifiers / Slack                            | :heavy_check_mark:             |
| Build / Extensions / Nuget Auth                                   | :heavy_check_mark:             |
| Build / Extensions / Nuget Packages Indexer                       | :heavy_check_mark:             |
| Build / Extensions / Perfmon                                      | :heavy_check_mark:             |
| Build / Extensions / PR Listeners / Bitbucket Cloud               | :heavy_check_mark:             |
| Build / Extensions / PR Listeners / Bitbucket Server              | :heavy_check_mark:             |
| Build / Extensions / PR Listeners / Github                        | :heavy_check_mark:             |
| Build / Extensions / PR Listeners / Gitlab                        | :heavy_check_mark:             |
| Build / Extensions / PR Listeners / Tfs (AzureDevOps)             | :heavy_check_mark:             |
| Build / Extensions / Ruby Env Configurator                        | :heavy_check_mark:             |
| Build / Extensions / Shared Resources                             | :heavy_check_mark:             |
| Build / Extensions / SSH Agent                                    | :heavy_check_mark:             |
| Build / Extensions / Swabra                                       | :heavy_check_mark:             |
| Build / Extensions / Vcs Labeling                                 | :heavy_check_mark:             |
| Build / Extensions / Xml Report Plugin                            | :heavy_check_mark:             |
| Build / Options                                                   | :heavy_check_mark:             |
| Build / Requirements                                              | :heavy_check_mark:             |
| Build / Runners / Ant                                             | :x:                            |
| Build / Runners / Cargo                                           | :x:                            |
| Build / Runners / Command Line                                    | :heavy_check_mark:             |
| Build / Runners / Conditions                                      | :heavy_check_mark:             |
| Build / Runners / Docker                                          | :x:                            |
| Build / Runners / Docker Compose                                  | :x:                            |
| Build / Runners / Dotnet                                          | :x:                            |
| Build / Runners / Dotnet DupFinder                                | :x:                            |
| Build / Runners / Dotnet Inspector                                | :x:                            |
| Build / Runners / Duplicator                                      | :x:                            |
| Build / Runners / FTP                                             | :x:                            |
| Build / Runners / FxCop                                           | :x:                            |
| Build / Runners / Gradle                                          | :x:                            |
| Build / Runners / Inspection                                      | :x:                            |
| Build / Runners / JPS                                             | :x:                            |
| Build / Runners / Maven2                                          | :x:                            |
| Build / Runners / MSpec                                           | :x:                            |
| Build / Runners / NAnt                                            | :x:                            |
| Build / Runners / Nuget Installer                                 | :x:                            |
| Build / Runners / Nuget Pack                                      | :x:                            |
| Build / Runners / Nuget Publish                                   | :x:                            |
| Build / Runners / NUnit                                           | :x:                            |
| Build / Runners / PowerShell                                      | :x:                            |
| Build / Runners / Python                                          | :x:                            |
| Build / Runners / Rake                                            | :x:                            |
| Build / Runners / SBT                                             | :x:                            |
| Build / Runners / SMB                                             | :x:                            |
| Build / Runners / SSH                                             | :x:                            |
| Build / Triggers / Cron                                           | :heavy_check_mark:             |
| Build / Triggers / Dependency                                     | :heavy_check_mark:             |
| Build / Triggers / Maven Artifact                                 | :heavy_check_mark:             |
| Build / Triggers / Maven Snapshot                                 | :heavy_check_mark:             |
| Build / Triggers / Nuget                                          | :heavy_check_mark:             |
| Build / Triggers / Remote Branch                                  | :heavy_check_mark:             |
| Build / Triggers / Retry                                          | :heavy_check_mark:             |
| Build / Triggers / Vcs                                            | :heavy_check_mark:             |
| Build / Vcs Settings                                              | :heavy_check_mark:             |
| Cleanup                                                           | :heavy_check_mark:             |
| Parameter                                                         | :heavy_check_mark:             |
| Project                                                           | :heavy_check_mark: :test_tube: |
| Project / Extensions / Issue Trackers / BitBucket                 | :heavy_check_mark:             |
| Project / Extensions / Issue Trackers / Bugzilla                  | :heavy_check_mark:             |
| Project / Extensions / Issue Trackers / Github                    | :heavy_check_mark:             |
| Project / Extensions / Issue Trackers / Jira                      | :heavy_check_mark:             |
| Project / Extensions / Issue Trackers / Tfs (AzureDevOps)         | :heavy_check_mark:             |
| Project / Extensions / Issue Trackers / YouTrack                  | :heavy_check_mark:             |
| Project / Extensions / Keep Rules                                 | :heavy_check_mark:             |
| Project / Extensions / OAuth Providers / Amazon Docker            | :heavy_check_mark:             |
| Project / Extensions / OAuth Providers / BitBucket Cloud          | :heavy_check_mark:             |
| Project / Extensions / OAuth Providers / Docker                   | :heavy_check_mark:             |
| Project / Extensions / OAuth Providers / Github                   | :heavy_check_mark:             |
| Project / Extensions / OAuth Providers / Gitlab                   | :heavy_check_mark:             |
| Project / Extensions / OAuth Providers / Jetbrains Space          | :heavy_check_mark:             |
| Project / Extensions / OAuth Providers / Slack                    | :heavy_check_mark:             |
| Project / Extensions / OAuth Providers / Tfs (AzureDevOps)        | :heavy_check_mark:             |
| Project / Extensions / Package Repositories / Nuget               | :heavy_check_mark:             |
| Project / Extensions / Report Tabs / Build Report                 | :heavy_check_mark:             |
| Project / Extensions / Report Tabs / Project Report               | :heavy_check_mark:             |
| Project / Extensions / Shared Resources                           | :heavy_check_mark:             |
| Project / Extensions / Versioned Settings                         | :heavy_check_mark:             |
| VCS Roots / Cvs                                                   | :x:                            |
| VCS Roots / Git                                                   | :heavy_check_mark:             |
| VCS Roots / Mercurial                                             | :x:                            |
| VCS Roots / Perforce                                              | :x:                            |
| VCS Roots / Star Team                                             | :x:                            |
| VCS Roots / Svn                                                   | :x:                            |
| VCS Roots / Tfs                                                   | :x:                            |

### Build / Runners

A quick note about the missing build runners, I am of the strong belief that
your pipeline should not rely on magic from the builder server. All
functionality can be built in your pipeline on top of the Command Line Runner.
All of those other types of build runners are magic IMO.

_That said if I get PRs for the other build runners, I'm not going to reject
them._
