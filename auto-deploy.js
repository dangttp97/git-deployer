//Configuration accept these git server: GiHub, Bitbucket and GitLab.
//Set gitServerType with these specify values: GitHub, Bitbucket, GitLab

const config = require("./configuration.json");
const http = require("http");
const { exec } = require("child_process");
const fs = require("fs");
var crypto = require("crypto");

const isGitDirectory = (path) => {
  return fs.existsSync(`${path}/.git`);
};

const isDirectoryExists = (path) => {
  return fs.existsSync(path);
};

const executeShellCommand = (command) => {
  exec(command, (err, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
};

const isCorrectGitServer = (headers, data, response) => {
  switch (config.gitServerType) {
    case "GitHub":
      var signer = crypto.createHmac("sha1", config.webhookSecret);
      var stringifyBody = JSON.stringify(data);
      console.log(stringifyBody);
      var result = signer.update(stringifyBody).digest("hex");
      const signature = headers["X-Hub-Signature"];

      if (signature !== expectedSignature) {
        return false;
      }

      return true;
    case "Bitbucket":
      break;
    case "GitLab":
      break;
    default:
      response.statusCode = 500;
      response.statusMessage = "Git server not supported";
      return false;
  }
};

const server = http.createServer(function (request, response) {
  //Check if directory exists, if not create it
  if (!isDirectoryExists(config.gitClonePath)) {
    executeShellCommand(`sudo mkdir ${config.gitClonePath}`);
  }

  //Check if directory is git repository, if not clone it from given repository with private key
  if (!isGitDirectory(config.gitClonePath)) {
    console.log(
      `WARNING: This folder is not a git folder\nCloning repo to ${config.gitClonePath}...`
    );
    executeShellCommand(
      `cd ${config.gitClonePath} && git clone ${config.gitRepoUrl} --config core.sshCommand="ssh -i ${config.gitPrivateKeyFilePath}"`
    );
  }

  //Handle webhook call
  if (request.method == "POST") {
    console.log(`Received POST method from: ${config.gitServerType}`);
    request.on("data", function (data) {
      if (isCorrectGitServer(request.headers, data, response)) {
        console.log("Git server verified, executing shell command...");
        executeShellCommand(config.shellCommand);
      } else {
        response.statusCode = 400;
        response.statusMessage = "Cannot verify git server";
      }
    });
  } else {
    response.statusCode = 501;
    response.statusMessage = "Method not supported";
  }
});

server.listen(config.webhookPort);
console.log(`Starting git auto deploy at port: ${config.webhookPort}`);
