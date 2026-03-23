#!/usr/bin/env node


"use strict";

const rJson = require("r-json");
const Logger = require("bug-killer");
const wJson = require("w-json");
const PackageJson = require("pkg.json");
const Semver = require("semver");
const spawno = require("spawno").promise;
const Tilda = require("tilda");
const pp = require("package-json-path");
const abs = require("abs");
const GitHub = require("gh.js");
const gitUrlParse = require("git-url-parse");
const findValue = require("find-value");
const barbe = require("barbe");
const ul = require("ul");
const mapO = require("map-o");
const BLAH_PATH = require.resolve("blah/bin/blah");
const spawn = require("child_process").spawn;

const packageJsonPromise = name => new Promise((resolve, reject) => {
    PackageJson(name, "latest", function (err, json) {
        if (err) {
            return reject(err);
        }
        resolve(json);
    });
});

const done = err => {
    if (err) {
        return Logger.log(err);
    }
    Logger.log("✅ Done.");
};

const commitAll = async msg => {
    Logger.log("📦 Adding the modified files.");
    await spawno("git", ["add", ".", "-A"], { output: true });

    Logger.log("📝 Committing the changes.");
    await spawno("git", ["commit", "-m", msg], { output: true });

    Logger.log("🚀 Pushing the new branch.");
    await spawno("git", ["push", "--all"], { output: true });
};

const npmInstall = async () => {
    await spawno("npm", ["install", "--production"], { output: true });
};

const generateDocs = async () => {
    Logger.log("📚 Generating documentation.");
    await spawno(BLAH_PATH, ["-f"], { output: true });
};

const currentBranch = async () => {
    const { stdout, stderr } = await spawno("git", ["rev-parse", "--abbrev-ref", "HEAD"], { output: true });
    return (stderr || stdout || "").trim();
};

const app = new Tilda(pp(__dirname + "/..")).action([{
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
}]).on("branch", async a => {
    try {
        const branchName = a.options.name.value;
        Logger.log("🌿 Creating and switching to the " + branchName + " branch.");
        await spawno("git", ["checkout", "-B", branchName], { output: true });
        await commitAll(a.options.message.value);
    } catch (e) {
        done(e);
    }
}).on("bump", async a => {
    try {
        const packPath = pp(process.cwd());
        let newVersion = null;

        const pack = rJson(packPath);
        try {
            const json = await packageJsonPromise(pack.name);
            if (Semver.major(json.version) === 0) {
                Logger.log("ℹ️ Since there is no 1.x.x release yet, setting 1.0.0.");
                pack.version = "1.0.0";
            } else {
                pack.version = Semver.inc(json.version, a.options.V.value);
                if (!pack.version) {
                    return Logger.log(new Error("Invalid version bump option value."));
                }
            }
            if (json) {
                Logger.log("⬅️ Old version was: " + json.version);
            }
            Logger.log("➡️ New version is: " + pack.version);
        } catch (e) {
            Logger.log(e);
            Logger.log("⚙️ Setting version to 1.0.0.");
            pack.version = "1.0.0";
        }
        newVersion = pack.version;
        Logger.log("🧩 Updating package.json (version: " + newVersion + ")");
        wJson(packPath, pack);
        const cBranch = await currentBranch();
        const branchName = a.options.branch.value;

        if (!a.options.c.is_provided) {
            // TODO Check if default branch. Too lazy right now to do that.
            a.options.c.value = cBranch !== "master" && cBranch !== "gh-pages";
        }

        if (a.options.c.value) {
            Logger.log("📍 Using the current branch.");
        } else {
            Logger.log("🔀 Switching to the " + branchName + " branch.");
            await spawno("git", ["checkout", "-B", branchName], { output: true });
        }

        await commitAll(":arrow_up: " + newVersion + " :tada:");
    } catch (e) {
        done(e);
    }
}).on("publish", async a => {
    let config = {};

    if (a.options.c.value) {
        try {
            config = require(abs(a.options.c.value));
        } catch (e) {
            Logger.log(e);
            return Logger.log(new Error("Cannot require the configuration file."));
        }
    }

    const readGhToken = () => {
        try {
            return require(abs("~/.github-config.json")).token;
        } catch (e) { };
    };

    const getRepoInfo = async (fullName) => {
        return new Promise((resolve, reject) => {
            gh.get("repos/" + fullName, function (err, repo) {
                if (err) {
                    return reject(err);
                }
                resolve(repo);
            });
        });
    }

    const createPullRequest = async (fullName, data) => {
        return new Promise((resolve, reject) => {
            gh.get("repos/" + fullName + "/pulls", {
                data: data,
                headers: {
                    Accept: "application/vnd.github.sailor-v-preview+json, application/vnd.github.v3+json"
                }
            }, function (err, pr) {
                if (err) {
                    return reject(err);
                }
                resolve(pr);
            });
        });
    }

    const createRelease = async (fullName, data) => {
        return new Promise((resolve, reject) => {
            gh.get("repos/" + fullName + "/releases", {
                data: data,
                headers: {
                    Accept: "application/vnd.github.sailor-v-preview+json, application/vnd.github.v3+json"
                }
            }, function (err, release) {
                if (err) {
                    return reject(err);
                }
                resolve(release);
            });
        });
    }

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

    const gh = new GitHub(config.token);
    const packPath = pp(process.cwd());

    try {
        const pack = rJson(packPath);
        const repoUrl = findValue(pack, "repository.url");
        if (!repoUrl) {
            return done("Cannot find the repository URL in package.json.");
        }
        const url = gitUrlParse(repoUrl);
        if (url.source !== "github.com") {
            return done("The repository is not hosted on GitHub.");
        }

        Logger.log("🔎 Getting repository info.");
        config.version = pack.version;
        const fullName = url.full_name;

        const repo = await getRepoInfo(fullName);
        await npmInstall();
        await generateDocs();
        await commitAll("Updated docs")
        const cBranch = await currentBranch();

        config.headBranch = cBranch;

        Logger.log("📬 Creating a pull request.");

        config.baseBranch = config.baseBranch || repo.default_branch;

        mapO(config, function (v) {
            return v && barbe(v, ["<", ">"], { pack: pack, repo: repo });
        });

        await createPullRequest(fullName, {
            title: config.title,
            body: config.body,
            head: config.headBranch,
            base: config.baseBranch
        });

        Logger.log("✅ Created the pull request.");

        Logger.log("🔀 Switching to " + config.baseBranch);
        await spawno("git", ["checkout", config.baseBranch], { output: true });

        Logger.log("⬇️ Updating from GitHub.");
        await spawno("git", ["pull", "origin", config.baseBranch], { output: true });

        Logger.log("🔁 Merging " + config.headBranch + " -> " + config.baseBranch);
        await spawno("git", ["merge", config.headBranch], { output: true });

        Logger.log("🚀 Pushing everything to GitHub.");
        await spawno("git", ["push", "--all"], { output: true });

        Logger.log("📦 Publishing to npm.");
        await new Promise(
            (res, rej) => spawn("npm", ["publish"], {
                stdio: "inherit"
            }).on("exit", c => c === 0 ? res() : rej(new Error(`exit ${c}`)))
        );

        Logger.log("🏷️ Creating a new GitHub release.");
        await createRelease(fullName, {
            tag_name: config.version,
            name: config.version,
            body: config.body
        });

        Logger.log("✅ Created a new release.");

        Logger.log("🧹 Deleting the " + config.headBranch + " branch locally.");
        await spawno("git", ["branch", "-d", config.headBranch], { output: true });

        Logger.log("🧹 Deleting the " + config.headBranch + " branch on GitHub.");
        await spawno("git", ["push", "origin", "--delete", config.headBranch], { output: true });
    } catch (e) {
        Logger.log(e);
    }
}).main(() => {
    app.displayHelp();
})
