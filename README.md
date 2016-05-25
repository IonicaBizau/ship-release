
[![ship-release](http://i.imgur.com/gOm6qum.png)](#)

# `$ ship-release`

 [![PayPal](https://img.shields.io/badge/%24-paypal-f39c12.svg)][paypal-donations] [![AMA](https://img.shields.io/badge/ask%20me-anything-1abc9c.svg)](https://github.com/IonicaBizau/ama) [![Version](https://img.shields.io/npm/v/ship-release.svg)](https://www.npmjs.com/package/ship-release) [![Downloads](https://img.shields.io/npm/dt/ship-release.svg)](https://www.npmjs.com/package/ship-release) [![Get help on Codementor](https://cdn.codementor.io/badges/get_help_github.svg)](https://www.codementor.io/johnnyb?utm_source=github&utm_medium=button&utm_term=johnnyb&utm_campaign=github)

> Publish new versions on GitHub and npm with ease.

## :cloud: Installation

You can install the package globally and use it as command line tool:


```sh
$ npm i -g ship-release
```


Then, run `ship-release --help` and see what the CLI tool can do.


```
$ ship-release --help
Usage: ship-release <command> [options]

Publish new versions on GitHub and npm with ease.

Commands:
  branch   Creates a new branch and commits the changes.
  bump     Bumps the version and creates a new branch.
  publish  Creates a pull request with the changes, merge it
           in the main branch, publish it on npm and create a
           GitHub release.

Options:
  -v, --version  Displays version information.
  -h, --help     Displays this help.

Documentation can be found at https://github.com/IonicaBizau/ship-release#readme.
```

## :yum: How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].


## :scroll: License

[MIT][license] © [Ionică Bizău][website]

[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RVXDDLKKLQRJW
[donate-now]: http://i.imgur.com/6cMbHOC.png

[license]: http://showalicense.com/?fullname=Ionic%C4%83%20Biz%C4%83u%20%3Cbizauionica%40gmail.com%3E%20(http%3A%2F%2Fionicabizau.net)&year=2016#license-mit
[website]: http://ionicabizau.net
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md
