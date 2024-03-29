#!/usr/bin/env node


"use strict";

var rJson = require("r-json"),
    Logger = require("bug-killer"),
    wJson = require("w-json"),
    PackageJson = require("package.json"),
    Semver = require("semver"),
    spawno = require("spawno"),
    spawnNpm = require("spawn-npm"),
    Tilda = require("tilda"),
    pp = require("package-json-path"),
    abs = require("abs"),
    oneByOne = require("one-by-one"),
    GitHub = require("gh.js"),
    gitUrlParse = require("git-url-parse"),
    findValue = require("find-value"),
    barbe = require("barbe"),
    ul = require("ul"),
    mapO = require("map-o"),
    BLAH_PATH = require.resolve("blah/bin/blah"),
    BABEL_IT_PATH = require.resolve("babel-it/bin/babel-it.js");

var done = function done(err, data) {
    if (err) {
        return Logger.log(err);
    }
    Logger.log("Done.");
};

var commitAll = function commitAll(msg) {
    return function (cb) {
        oneByOne([function (next) {
            Logger.log("Adding the modified files.");
            spawno("git", ["add", ".", "-A"], { output: true }, next);
        }, function (next) {
            Logger.log("Committing the changes");
            spawno("git", ["commit", "-m", msg], { output: true }, next);
        }, function (next) {
            Logger.log("Pushing the new branch");
            spawno("git", ["push", "--all"], { output: true }, next);
        }], cb);
    };
};

var npmInstall = function npmInstall(next) {
    spawnNpm("install", { production: true }, { output: true }, next);
};

var generateDocs = function generateDocs(next) {
    Logger.log("Generating documentation.");
    spawno(BLAH_PATH, ["-f"], {
        output: true
    }, next);
};

var currentBranch = function currentBranch(cb) {
    spawno("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
        output: true
    }, function (err, stdout, stderr) {
        stdout = stdout && stdout.trim();
        cb(stderr || err, stdout);
    });
};

new Tilda(pp(__dirname + "/..")).action([{
    name: "branch",
    desc: "Creates a new branch and commits the changes.",
    options: [{
        name: "message",
        opts: ["m", "message"],
        desc: "The commit message.",
        type: String,
        default: "Working on the new version."
    }, {
        opts: ["n", "name"],
        name: "name",
        desc: "The branch name.",
        type: String,
        default: "new-version"
    }]
}, {
    name: "bump",
    desc: "Bumps the version and creates a new branch.",
    options: [{
        opts: ["V", "bump-version"],
        desc: "The semver tag to bump (major|minor|patch)",
        type: String,
        default: "patch"
    }, {
        opts: ["c", "current-branch"],
        desc: "If provided, an additional branch will not be created.",
        type: Boolean,
        default: false
    }, {
        opts: ["b", "branch"],
        desc: "The branch name to switch to.",
        type: String,
        default: "new-version"
    }]
}, {
    name: "publish",
    desc: "Creates a pull request with the changes, merge it in the main branch, publish it on npm and create a GitHub release.",
    options: [{
        opts: ["T", "token"],
        desc: "The GitHub token.",
        type: String
    }, {
        opts: ["t", "title"],
        desc: "The pull request title.",
        type: String
    }, {
        opts: ["d", "description"],
        desc: "The pull request/release description.",
        type: String
    }, {
        opts: ["b", "base-branch"],
        desc: "The base branch (defaults to the repository main branch).",
        type: String
    }, {
        opts: ["c", "config-path"],
        desc: "The path to a json/js file exporting ",
        type: String
    }]
}]).on("branch", function (a) {
    oneByOne([function (next) {
        var branchName = a.options.name.value;
        Logger.log("Creating and switching on the " + branchName + " branch.");
        spawno("git", ["checkout", "-B", branchName], { output: true }, next);
    }, commitAll(a.options.message.value)], done);
}).on("bump", function (a) {
    var packPath = pp(process.cwd());
    var setPackVersion = function setPackVersion(pack, cb) {
        PackageJson(pack.name, "latest", function (err, json) {
            if (err) {
                Logger.log(err);
                Logger.log("Setting 1.0.0");
                pack.version = "1.0.0";
            } else if (Semver.major(json.version) === 0) {
                Logger.log("Since there is no 1.x.x release yet, setting 1.0.0.");
                pack.version = "1.0.0";
            } else {
                pack.version = Semver.inc(json.version, a.options.V.value);
                if (!pack.version) {
                    return Logger.log(new Error("Invalid version bump option value."));
                }
            }
            if (json) {
                Logger.log(">>> Old version was: " + json.version);
            }
            Logger.log(">>> New version is: " + pack.version);
            cb(null, pack);
        });
    };

    var newVersion = null;
    oneByOne([function (next) {
        return rJson(packPath, next);
    }, function (next, pack) {
        return setPackVersion(pack, next);
    }, function (next, pack) {
        newVersion = pack.version;
        Logger.log("Updating package.json (version: " + newVersion + ")");
        wJson(packPath, pack, next);
    }
    //, npmInstall
    //, generateDocs
    , currentBranch, function (next, currentBranch) {
        var branchName = a.options.branch.value;

        if (!a.options.c.is_provided) {
            // TODO Check if default branch. Too lazy right now to do that.
            a.options.c.value = currentBranch !== "master" && currentBranch !== "gh-pages";
        }

        if (a.options.c.value) {
            Logger.log("Using the current branch.");
            return next();
        }

        Logger.log("Switching on the " + branchName);
        spawno("git", ["checkout", "-B", branchName], { output: true }, next);
    }, function (next) {
        return commitAll(":arrow_up: " + newVersion + " :tada:")(next);
    }], done);
}).on("publish", function (a) {
    var config = {};

    if (a.options.c.value) {
        try {
            config = require(abs(a.options.c.value));
        } catch (e) {
            Logger.log(e);
            return Logger.log(new Error("Cannot require the configuration file."));
        }
    }

    var readGhToken = function readGhToken() {
        try {
            return require(abs("~/.github-config.json")).token;
        } catch (e) {};
    };

    config.token = config.token || a.options.T.value || readGhToken();
    if (!config.token) {
        return Logger.log(new Error("A GitHub token is required."));
    }

    config = ul.merge({
        title: a.options.title.value || "<pack.name> <pack.version>",
        body: a.options.description.value,
        baseBranch: a.options.b.value
    }, config);

    if (!config.body) {
        return Logger.log(new Error("The pull request description is required."));
    }

    var gh = new GitHub(config.token),
        packPath = pp(process.cwd()),
        fullName = null,
        repo = null,
        url = null,
        pack = null;

    oneByOne([function (next) {
        return rJson(packPath, next);
    }, function (next, _pack) {
        pack = _pack;

        var repoUrl = findValue(pack, "repository.url");
        if (!repoUrl) {
            return next(new Error("Cannot find the repository url in package.json"));
        }

        url = gitUrlParse(repoUrl);
        if (url.source !== "github.com") {
            return next(new Error("The repository is not hosted on GitHub."));
        }

        Logger.log("Getting repo info");
        config.version = pack.version;
        fullName = url.full_name;
        gh.get("repos/" + fullName, function (err, _repo) {
            repo = _repo;
            next(err, repo);
        });
    }, npmInstall, generateDocs, commitAll("Updated docs"), function (next) {
        currentBranch(function (err, cBranch) {
            if (err) {
                return next(err);
            }
            config.headBranch = cBranch;
            next(null, repo, url, pack);
        });
    }, function (next) {
        Logger.log("Creating pull request");
        config.baseBranch = config.baseBranch || repo.default_branch;

        mapO(config, function (v) {
            return v && barbe(v, ["<", ">"], { pack: pack, repo: repo });
        });

        debugger
        gh.get("repos/" + fullName + "/pulls", {
            data: {
                title: config.title,
                body: config.body,
                head: config.headBranch,
                base: config.baseBranch
            },
            headers: {
                Accept: "application/vnd.github.sailor-v-preview+json, application/vnd.github.v3+json"
            }
        }, next);
    }, function (next) {
        debugger;
        Logger.log("Created pull request");
        Logger.log("Switching to " + config.baseBranch);
        spawno("git", ["checkout", config.baseBranch], { output: true }, next);
    }, function (next) {
        Logger.log("Updating from GitHub");
        spawno("git", ["pull", "origin", config.baseBranch], { output: true }, next);
    }, function (next) {
        Logger.log("Merging " + config.headBranch + " -> " + config.baseBranch);
        spawno("git", ["merge", config.headBranch], { output: true }, next);
    }, function (next) {
        Logger.log("Push everything on GitHub");
        spawno("git", ["push", "--all"], { output: true }, next);
    }, function (next) {
        Logger.log("Publishing on npm.");
        spawno(BABEL_IT_PATH, {
            output: true
        }, next);
    }, function (next) {
        Logger.log("Creating new GitHub release.");
        gh.get("repos/" + fullName + "/releases", {
            data: {
                tag_name: config.version,
                name: config.version,
                body: config.body
            }
        }, next);
    }, function (next) {
        Logger.log("Created new release.");
        Logger.log("Deleting the " + config.headBranch + " branch locally.");
        spawno("git", ["branch", "-d", config.headBranch], { output: true }, next);
    }, function (next) {
        Logger.log("Deleting the " + config.headBranch + " branch on GitHub.");
        spawno("git", ["push", "origin", "--delete", config.headBranch], { output: true }, next);
    }], done);
});
