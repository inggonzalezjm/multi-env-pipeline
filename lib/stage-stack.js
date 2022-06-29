const { Stage, Tags } = require("aws-cdk-lib");
const { EnvironmentStack } = require("./environment-stack");
class StageStack extends Stage {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { env, envParams, AppConfigs } = props;

    const environmentProps = {
      env,
      envParams,
      AppConfigs,
    };
    const environment = new EnvironmentStack(this, "environment-stack", environmentProps);

    if (AppConfigs.Globals.Tags) {
      for (const t in AppConfigs.Globals.Tags) {
        Tags.of(environment).add(t, AppConfigs.Globals.Tags[t]);
      }
    }
    if (envParams.Tags) {
      for (const t in envParams.Tags) {
        Tags.of(environment).add(t, envParams.Tags[t]);
      }
    }
    Tags.of(environment).add("Environment", `${envParams.Name}`);
  }
}

module.exports = { StageStack };
