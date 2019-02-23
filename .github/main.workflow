workflow "Test most recent commit" {
  on = "push"
  resolves = ["Remove Test Stack"]
}

action "Install modules" {
  uses = "elizabeth-warren/serverless-integration-testing@master"
  runs = "npm install"
}

action "Create Test Stack" {
  needs = "Install modules"
  uses = "elizabeth-warren/serverless-integration-testing@master"
  runs = ["sh", "-c", "sls deploy --stage $GITHUB_SHA"]
  secrets = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_DEFAULT_REGION",
  ]
}

action "Run Integration Tests" {
  uses = "elizabeth-warren/serverless-integration-testing@master"
  runs = "npm run test:integration"
  needs = "Create Test Stack"
}

action "Remove Test Stack" {
  uses = "elizabeth-warren/serverless-integration-testing@master"
  runs = ["sh", "-c", "sls remove --stage $GITHUB_SHA"]
  needs = "Run Integration Tests"
  secrets = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_DEFAULT_REGION",
  ]
}
