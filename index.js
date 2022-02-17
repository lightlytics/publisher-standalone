const got = require('got');
const fs = require('fs');
const path = require('path');
const minimist = require('minimist')

function removeAwsCredentials(plan) {
  if (plan && plan.configuration && plan.configuration.provider_config && plan.configuration.provider_config.aws && plan.configuration.provider_config.aws.expressions) {
    delete plan['configuration']['provider_config']['aws']['expressions']['access_key']
    delete plan['configuration']['provider_config']['aws']['expressions']['secret_key']
  }
}

const args = minimist(process.argv.slice(2))

if (args['help'] || args['h']) {
  return console.log("Expected usage: node index.js --dir=\"./working-dir\" --hostname=\"org.lightlytics.com\" --plan=\"./working-dir/plan.json\" --graph=\"./working-dir/graph.dot\" --token=\"collection-token\"")
}

if (Object.keys(args).length - 1 < 5) {
  throw new ArgsException("Expected at least 4 cli arguments. usage: node index.js --dir=\"./working-dir\" --hostname=\"org.lightlytics.com\" --plan=\"./working-dir/plan.json\" --graph=\"./working-dir/graph.dot\" --token=\"collection-token\"")
}

const requiredArgs = ['dir', 'hostname', 'plan', 'graph', 'token']

requiredArgs.forEach(requiredArg => {
  if(!args[requiredArg])
    throw new ArgsException(`Missing arg - \"${requiredArg}\" usage: node index.js --${requiredArg}=value. try --help if needed`)
})

const workingDirArg = args['dir']
const hostname = args['hostname']
const terraformPlanPath = args['plan']
const terraformGraphPath = args['graph']
const collectionToken = args['token']

try {
  const workingDir = workingDirArg.replace(/\/$/, '')

  const modulesPath = path.normalize(`${workingDir}/.terraform/modules/modules.json`);
  let modules = {}
  if (fs.existsSync(modulesPath)) {
    modules = JSON.parse(fs.readFileSync(modulesPath, "utf8"));
  }
  const locals = {};

  if (!modules.Modules)
    modules["Modules"] = [];

  modules["Modules"].push({
    Key: "root_module",
    Source: "root_module",
    Dir: "./"
  });

  modules.Modules.filter((module) => module.Key && module.Dir && module.Source)
    .filter(module => fs.existsSync(path.normalize(`${workingDir}/${module.Dir}`)))
    .forEach((module) => {
      fs.readdirSync(path.normalize(`${workingDir}/${module.Dir}`)).forEach((fileName) => {
        const fileExtension = path.parse(fileName).ext;
        if (fileExtension !== ".tf") return;

        const filePath = `${workingDir}/${module.Dir}/${fileName}`;
        const moduleContent = fs.readFileSync(filePath, "utf8");

        getLocalsFromModule(moduleContent, locals, module.Source);
      });
    });

  const plan = JSON.parse(fs.readFileSync(terraformPlanPath, 'utf8'))

  let graph
  if (terraformGraphPath) {
    graph = fs.readFileSync(terraformGraphPath, 'utf8')
  }

  removeAwsCredentials(plan)

  const publishUrl = `https://${hostname}/api/v1/collection/terraform`
  const headers = {
    'X-Lightlytics-Token': collectionToken
  }

  const data = {
    locals,
    plan,
    graph,
    metadata: {},
  }

  got.post(publishUrl, {
    json: data,
    responseType: 'json',
    headers
  }).then((res) => {
    const eventId = res.body.eventId
    const customerId = res.body.customerId

    logFormattedSimulation(`https://${hostname}/w/${customerId}/simulations/${eventId}`)

  }).catch(error => console.error(error));
} catch (error) {
  console.error(error)
}

function logFormattedSimulation(link) {
  const pullRequestMessage = `An execution simulation has been generated by **Lightlytics**, to view this run impact analysis, Visit:
${link}

> _This comment was added automatically by a git workflow to help DevOps teams predict what will be the impact of the proposed change after completing this PR_`

  console.log(pullRequestMessage)
}

function getLocalsFromModule(module, locals, moduleName) {
  let blockCnt = 0;
  let currentBlockLines = "";

  module.split("\n").forEach((line) => {
    const sanitizedLine = String(line).trim();
    if (sanitizedLine.startsWith("#")) return;

    if (blockCnt > 0) {
      currentBlockLines += line;
    }

    if (blockCnt > 0 && sanitizedLine === "{") {
      blockCnt++;
    }

    if (sanitizedLine === "locals {") {
      currentBlockLines = "";
      blockCnt = 1;
    }

    if (sanitizedLine === "}" && blockCnt > 0) {
      blockCnt--;
      if (blockCnt === 0) {
        if (!locals[moduleName]) locals[moduleName] = []
        locals[moduleName].push(currentBlockLines);
      }
    }
  });
}

function ArgsException(message) {
  this.message = message;
  this.name = 'ArgsException';
}