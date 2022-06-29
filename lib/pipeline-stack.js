const { Stack } = require("aws-cdk-lib");
const { Repository } = require("aws-cdk-lib/aws-codecommit");
const { CodePipeline, ShellStep, ManualApprovalStep, CodePipelineFileSet } = require("aws-cdk-lib/pipelines");
const { Artifact, Pipeline } = require("aws-cdk-lib/aws-codepipeline");
const { CodeCommitSourceAction, CodeBuildAction } = require("aws-cdk-lib/aws-codepipeline-actions");
const { PipelineProject, BuildSpec, LinuxBuildImage } = require("aws-cdk-lib/aws-codebuild");
const { StageStack } = require("./stage-stack");

class PipelineStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { AppConfigs } = props;

    const appName = AppConfigs.Globals.AppName;
    const appRepository = new Repository(this, `${appName}-repository`, {
      repositoryName: `${appName}-repository`,
    });

    const sourceOutput = new Artifact("source-output");
    const sourceAction = new CodeCommitSourceAction({
      actionName: "Source",
      repository: appRepository,
      output: sourceOutput,
    });

    const testProject = new PipelineProject(this, `${appName}-unit-testing`, {
      projectName: `${appName}-unit-testing`,
      environment: {
        buildImage: LinuxBuildImage.STANDARD_5_0,
      },
      buildSpec: BuildSpec.fromObject({
        version: "0.2",
        phases: {
          install: {
            "runtime-versions": {
              nodejs: "latest",
            },
            commands: [
              "npm ci",
              "gem install cfn-nag",
              "pip install cfn-lint",
              "pip install typing-extensions",
              "pip install spotipy --upgrade",
              "pip install semgrep",
            ],
          },
          build: {
            commands: [
              "npm run test",
              "npx cdk synth",
              "mkdir ./cfnnag_output",
              `for template in $(find ./cdk.out -type f -maxdepth 2 -name '*.template.json'); do cp $template ./cfnnag_output; done`,
              "cfn_nag_scan --deny-list-path .cfnnagignore --input-path ./cfnnag_output",
              "cfn-lint ./cfnnag_output/*",
              "semgrep --version",
              "semgrep --config=p/javascript ./cfnnag_output",
            ],
          },
        },
      }),
    });

    const testOutput = new Artifact("test-output");
    const testAction = new CodeBuildAction({
      actionName: "Unit-Testing",
      project: testProject,
      input: sourceOutput,
      outputs: [testOutput],
    });

    const appPipeline = new Pipeline(this, `${appName}-pipeline`, {
      pipelineName: `${appName}-pipeline`,
      enableKeyRotation: true,
      stages: [
        {
          actions: [sourceAction],
          stageName: "Source",
        },
        {
          actions: [testAction],
          stageName: "Test",
        },
      ],
    });

    const buildFileSet = CodePipelineFileSet.fromArtifact(sourceOutput);
    const cdkPipeline = new CodePipeline(this, `${appName}-cdk-pipeline`, {
      selfMutation: true,
      codePipeline: appPipeline,
      synth: new ShellStep("Synthesis", {
        input: buildFileSet,
        crossAccountKeys: true,
        commands: ["npm ci", "npx cdk synth"],
      }),
    });

    if (AppConfigs.Environments) {
      const environments = Object.keys(AppConfigs.Environments);
      environments.forEach((e) => {
        const environment = AppConfigs.Environments[e];
        const stageProps = {
          env: {
            account: environment.Account,
            region: environment.Region,
          },
          envParams: environment,
          AppConfigs,
        };
        const stage = new StageStack(this, `${appName}-${environment.Name}`, stageProps);

        if (environment.ManualApprovalStep) {
          cdkPipeline.addStage(stage, {
            pre: [new ManualApprovalStep(environment.ManualApprovalStep)],
          });
        } else {
          cdkPipeline.addStage(stage);
        }
      });
    }
  }
}

module.exports = { PipelineStack };
