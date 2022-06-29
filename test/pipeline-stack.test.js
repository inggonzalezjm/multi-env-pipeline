/* eslint-disable no-new */

const { App } = require("aws-cdk-lib");
const { Template } = require("aws-cdk-lib/assertions");
const { PipelineStack } = require("../lib/pipeline-stack");
const { AppConfigs } = require("./configs/configs");

describe("Pipeline", () => {
  test("snapshot after refactor", () => {
    const app = new App();
    // WHEN

    const pipelineProps = {
      env: {
        account: AppConfigs.Globals.DeploymentAccount,
        region: AppConfigs.Globals.DeploymentRegion,
      },
      AppConfigs,
    };
    const stack = new PipelineStack(app, `${AppConfigs.Globals.AppName}-pipeline-stack`, pipelineProps);

    // THEN
    const template = Template.fromStack(stack);
    expect(template).toMatchSnapshot();
  });
});
