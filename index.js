/* eslint-disable no-console */
const PATH_PREV_STATUS = './prevStatus.json';
const config = require('./.config.json');
const githubToken = config.github.username + ':' + config.github.token;
const slackToken = config.slack.token;
const notify = require('./slack')( slackToken, config.slack.sendTo, config.slack.bot.icon, config.slack.bot.name).notify;
const github = require('./github')( config.github.issuePath, githubToken );

const prevStatus = load();
const since = new Date(prevStatus.endAt);

console.log('>> start checking issues since %s', since);

collectIssues(since, 1, [])
  .then(function(pulls) {
    //debug
    return pulls;
  })
  .then(getFiles)
  .then(function(pulls) {
    console.log( 'finally %s pulls found', pulls.length );
    pulls.forEach(notifyRemarkablePullRequest);
    save({
      endAt: new Date()
    });
  }).catch(error);

function collectIssues(since, page, issues) {
  console.log('>> get page %s', page);
  return github
    .getIssues(since, page)
    .then(handleIssueResponse, error)
    .then(function( res ){
      if (res.end) {
        return issues;
      }

      return collectIssues(since, page+1, issues.concat(res.issues));
    }, error)
    .catch(error);
}

function handleIssueResponse(response) {
  if (response.issues.length == 0) {
    return {
      end: true
    };
  }
  var pulls = response.issues
                .filter(isNewerCreated(since))
                .filter(isPullRequest)
                .filter(isInWhiteList);

  pulls.forEach(function(issues){
    console.log('created_at:' + issues.created_at);
  });

  return {
    issues: pulls,
    end: false
  };
}

function getFiles( pulls ) {
  var promisies = pulls.map(function(pull) {
    return github.getPullRequestFiles(pull.pull_request.url, pull);
  });

  console.log('    >> filter to forntend like pullrequest');
  return Promise.all(promisies).then(handleFilesResponse, error);
}

function handleFilesResponse(responses) {
  responses = responses.filter(function(response) {
    var files = response.files;

    return files.filter(isTargetFile).length > 0;
  });
  console.log('    >> %s pull requests are fontend like', responses.length);

  return responses.map(function(response) {
    var result = response.params;
    result.files = response.files;
    return result;
  });
}

function error(err) {
  console.log(err);
  throw err;
}

function isInWhiteList(pull) {
  var whiteList = config.pullrequest.url.whiteList;

  return whiteList.some( function( white ) {
    return pull.pull_request.url.match(white);
  });
}


function isTargetFile(file) {
  var whiteList = config.pullrequest.targetFile.whiteList;

  return whiteList.some( function( white ) {
    return file.filename.match(white);
  });
}

function isPullRequest(issue){
  return !!issue.pull_request;
}

function isNewerCreated(createdAt){
  return function (issue) {
    return new Date(createdAt).getTime() < new Date(issue.created_at).getTime();
  };
}

function notifyRemarkablePullRequest(pull){
  var pullAttachment = {
    title: '[' + pull.repository.name + '] ' + pull.title,
    title_link: pull.pull_request.html_url,
    author_name: pull.user.login,
    author_icon: pull.user.avatar_url
  };

  notify('', [pullAttachment]);
}

function save(status) {
  const fs = require('fs');
  fs.writeFileSync( PATH_PREV_STATUS, JSON.stringify(status) );
}

function load() {
  const fs = require('fs');
  return JSON.parse(fs.readFileSync( PATH_PREV_STATUS ));
}
