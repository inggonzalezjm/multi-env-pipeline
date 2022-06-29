/* eslint-disable no-new */

const { Stack, Tags } = require("aws-cdk-lib");
const { Template } = require("aws-cdk-lib/assertions");
const { EnvironmentStack } = require("../lib/environment-stack");
const { AppConfigs } = require("./configs/configs");

describe("Environment", () => {
  test("snapshot after refactor", () => {
    const stack = new Stack();

    const envParams = AppConfigs.Environments["TestEnv1"];

    const environmentProps = {
      env: {
        account: AppConfigs.Globals.DeploymentAccount,
        region: AppConfigs.Globals.DeploymentRegion,
      },
      envParams: envParams,
      AppConfigs,
    };

    const environment = new EnvironmentStack(stack, "environment-stack", environmentProps);
    if (AppConfigs.Globals.Tags) {
      for (const t in AppConfigs.Globals.Tags) {
        Tags.of(stack).add(t, AppConfigs.Globals.Tags[t]);
      }
    }
    if (envParams.Tags) {
      for (const t in envParams.Tags) {
        Tags.of(stack).add(t, envParams.Tags[t]);
      }
    }
    Tags.of(stack).add("Environment", `${envParams.Name}`);

    const template = Template.fromStack(environment);
    expect(template).toMatchSnapshot();
  });
});
