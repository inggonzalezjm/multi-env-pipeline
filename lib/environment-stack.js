const { Stack, RemovalPolicy } = require("aws-cdk-lib");
const { Bucket, BucketEncryption, BlockPublicAccess } = require("aws-cdk-lib/aws-s3");
class EnvironmentStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { envParams } = props;
    const bucketName = envParams.BucketName;

    const myBucket = new Bucket(this, bucketName, {
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}

module.exports = { EnvironmentStack };
