#!/usr/bin/env node

const { App } = require("aws-cdk-lib");
const { PipelineStack } = require("../lib/pipeline-stack");
const { AppConfigs } = require("../configs/configs");

const app = new App();

const pipelineProps = {
  env: {
    account: AppConfigs.Globals.DeploymentAccount,
    region: AppConfigs.Globals.DeploymentRegion,
  },
  AppConfigs,
};

new PipelineStack(app, `${AppConfigs.Globals.AppName}-pipeline-stack`, pipelineProps);
