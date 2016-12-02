/* eslint-disable no-console */
const fetch = require('fetch');
const moment = require('moment');

/**
 * @param {String} TOKEN generated on https://github.com/settings/tokens
 *                       required scopes
 *                       - repo
 * @return {Object}
 */
module.exports = function(issuePath, TOKEN) {
  return {
    /**
     * @param {?Date} since is pagination parameter like offset. see the official document https://developer.github.com/v3/issues/
     * @return {Promise} then(function( {meta:{Object}, issues:{Array}} ))
     */
    getIssues: function(since, page) {

      if (since) {
        since = moment(since).utc().format('YYYY-MM-DDTHH:mm:ssZ');
      }

      if (!page) {
        page = 1;
      }

      console.log('since:' + since);

      return new Promise(function(resolve) {
        var queryParam = {
          filter: 'all',
          per_page: 20,
          sort: 'created',
          direction: 'asc',
          page: page
        };

        if (since) {
          queryParam.since = since;
        }

        console.log('query:' + queryString(queryParam));

        // 1. 直近のissueを50件取ってくる
        github(issuePath + '?' + queryString(queryParam), function(err, meta, json) {
          if (err) {
            throw err;
          }

          resolve({
            meta: meta,
            issues: json
          });
        });
      });
    },
    /**
     * @param {String} pullRequestUrl is absolute path for pullrequest web api
     * @param {Object} params is passed as an argument of callback 'then'
     * @return {Promise} then(function( {meta:{Object}, files:{Array}, params:{?Object}} ))
     */
    getPullRequestFiles: function(pullRequestUrl, params){
      return new Promise(function(resolve, reject){
        pullRequestUrl = pullRequestUrl.split('api.github.com').pop();
        github( pullRequestUrl + '/files', function(err, meta, json) {
          if (err) {
            reject(err);
            return;
          }
          var files = json;
          resolve({
            meta: meta,
            files: files,
            params: params
          });
        });
      });
    },
    parseLinkHeader: function( linkHeaderString ){
      var links = linkHeaderString.split(',');
      links = links.reduce(function(result, linkString) {
        var tokens = linkString.split(';');
        var url = tokens[0].match(/<(.*)>/)[1];
        var rel = tokens[1].match(/rel="(.*)"/)[1];

        result[rel] = url;

        return result;
      }, {});

      return links;
    }
  };

  function github(entryPoint, callback) {
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };
    fetch.fetchUrl( 'https://'+TOKEN+'@api.github.com' + entryPoint, {headers: headers}, function(err, meta, body) {
      var responseJSON = JSON.parse(body.toString());
      callback(err, meta, responseJSON);
    });
  }

  function queryString(params){
    var queryStrings = Object.keys(params).map(function(key) {
      var val = params[key];

      return encodeURIComponent(key) + '=' + encodeURIComponent(val);
    });

    return queryStrings.join('&');
  }
};

