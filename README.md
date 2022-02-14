# Lightlytics-Publisher-Standalone
A NodeJS standalone publisher used to send a Terraform plan output in JSON format and trigger a Simulation run in Lightlytics.
# Usage
run `npm install` and then run the app using cli args

example: `node index.js --dir="./working-dir" --hostname="org.lightlytics.com" --plan="./working-dir/plan.json" --graph="./working-dir/graph.dot" --token="collection-token"`

# Action parameters and description
The Publisher required arguments input (**in this exact order**):
* 'dir': the same directory in which `terraform init` executed
* 'hostname' - The organization specific Lightlytics URL. *eg. org.lightlytics.com*
* 'plan' - A Terraform plan in JSON format that was generated using the `terraform show -json ./terraform.plan > ./plan.json` command.
* 'graph' - A Terraform graph in dot format that was generated using the `terraform graph -type=plan > ./graph.dot` command.
* 'token' - The AWS account's specific collection token (can be found on Lightlytics UI -> settings -> Integrations -> AWS Account -> collection token).
