workflow "Test most recent commit" {
  on = "push"
  resolves = ["Create Test Stack"]
}

action "Create Test Stack" {
  uses = "elizabethwarren/serverless-integration-testing@master"
  runs = ["sh", "-c", "sls deploy --stage $GITHUB_SHA"]
  secrets = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_DEFAULT_REGION",
  ]
}

action "Run Integration Tests" {
  uses = "elizabethwarren/serverless-integration-testing@master"
  runs = "npm run test:integration"
  needs = "Create Test Stack"
  secrets = [
    "INCOMING_SLACK_URI",
  ]
}

action "Remove Test Stack" {
  uses = "elizabethwarren/serverless-integration-testing@master"
  runs = ["sh", "-c", "sls remove --stage $GITHUB_SHA"]
  needs = "Create Test Stack"
  secrets = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_DEFAULT_REGION",
  ]
}
