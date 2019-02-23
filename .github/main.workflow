workflow "Test most recent commit" {
  on = "push"
  resolves = ["Create Test Stack"]
}

action "Create Test Stack" {
  uses = "elizabeth-warren/serverless-integration-testing@master"
  runs = ["ls"]
}
