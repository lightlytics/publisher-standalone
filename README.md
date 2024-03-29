# Lightlytics-Publisher-Standalone

A NodeJS standalone publisher used to send a Terraform plan output in JSON format and trigger a Simulation run in
Lightlytics.

## Prerequisites

- Node.js v14+

# Usage

run `npm install` and then run the app using cli args

example: `node index.js --dir="./working-dir" --hostname="org.lightlytics.com" --plan="./working-dir/plan.json" --graph="./working-dir/graph.dot" --token="collection-token"`

# Action parameters and description

The Publisher required arguments input (**in this exact order**):

* **'dir'** - the same directory in which `terraform init` executed
* **'hostname'** - The organization specific Lightlytics URL. *eg. org.lightlytics.com*
* **'plan'** - A Terraform plan in **JSON** format that was generated using
  the `terraform show -json ./terraform.plan > ./plan.json` command.
    * Alternatively - For Terraform Cloud, 'tfc-token' and 'tfc-run-id'
* **'graph'** - A Terraform graph in dot format that was generated using the `terraform graph -type=plan > ./graph.dot`
  command.
* **'token'** - The AWS account's specific collection token (can be found on Lightlytics UI -> settings -> Integrations
  -> AWS Account -> collection token).


* Optional Git metadata:
    * 'name' - supported values - 'Github' / 'Bitbucket'
    * 'type' - supported values - 'Github' / 'Bitbucket'
    * 'format' - supported values - 'Terraform'
    * 'branch' - Your git branch name
    * 'base_branch' - for example 'main' or 'master'
    * 'commit_hash' - last commit of current branch
    * 'pr_id' - Pull request ID
    * 'repository' - company/repository for example - lightlytics/publisher-standalone
    * 'user_name' - Git username that created this commit / PR
* Optional Polling
    * 'poll' - when specified, will start polling for simulation status and will report back when it reached a
      conclusion
    * 'pollTimeout' - (Minutes - Default: 10) after this period, polling will stop with 'Timed-out' status
    * 'pollInterval' - (Milliseconds - Default: 5000) Interval of which each request should be made
    * 'markdown' - when specified, will print simulation output in markdown form rather than CLI table