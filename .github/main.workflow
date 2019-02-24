workflow "Test most recent commit" {
  on = "push"
  resolves = ["Run Integration Test"]
}

action "Run Integration Test" {
  uses = "elizabeth-warren/serverless-integration-testing@master"
  secrets = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_DEFAULT_REGION",
  ]
}
