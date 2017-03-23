
[![ship-release](http://i.imgur.com/gOm6qum.png)](#)

# `$ ship-release`

 [![Support me on Patreon][badge_patreon]][patreon] [![Buy me a book][badge_amazon]][amazon] [![PayPal][badge_paypal_donate]][paypal-donations] [![Version](https://img.shields.io/npm/v/ship-release.svg)](https://www.npmjs.com/package/ship-release) [![Downloads](https://img.shields.io/npm/dt/ship-release.svg)](https://www.npmjs.com/package/ship-release)

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


## :sparkling_heart: Support my projects

I open-source almost everything I can, and I try to reply everyone needing help using these projects. Obviously,
this takes time. You can integrate and use these projects in your applications *for free*! You can even change the source code and redistribute (even resell it).

However, if you get some profit from this or just want to encourage me to continue creating stuff, there are few ways you can do it:

 - Starring and sharing the projects you like :rocket:
 - [![PayPal][badge_paypal]][paypal-donations]—You can make one-time donations via PayPal. I'll probably buy a ~~coffee~~ tea. :tea:
 - [![Support me on Patreon][badge_patreon]][patreon]—Set up a recurring monthly donation and you will get interesting news about what I'm doing (things that I don't share with everyone).
 - **Bitcoin**—You can send me bitcoins at this address (or scanning the code below): `1P9BRsmazNQcuyTxEqveUsnf5CERdq35V6`

    ![](https://i.imgur.com/z6OQI95.png)

Thanks! :heart:



## :sparkles: Related

 - [`babel-it`](https://github.com/IonicaBizau/babel-it#readme)—Babelify your code before `npm publish`.
 - [`dist-it`](https://github.com/IonicaBizau/dist-it)—Generate minified bundles from modular inputs using Browserify.



## :scroll: License

[MIT][license] © [Ionică Bizău][website]

[badge_patreon]: http://ionicabizau.github.io/badges/patreon.svg
[badge_amazon]: http://ionicabizau.github.io/badges/amazon.svg
[badge_paypal]: http://ionicabizau.github.io/badges/paypal.svg
[badge_paypal_donate]: http://ionicabizau.github.io/badges/paypal_donate.svg
[patreon]: https://www.patreon.com/ionicabizau
[amazon]: http://amzn.eu/hRo9sIZ
[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RVXDDLKKLQRJW
[donate-now]: http://i.imgur.com/6cMbHOC.png

[license]: http://showalicense.com/?fullname=Ionic%C4%83%20Biz%C4%83u%20%3Cbizauionica%40gmail.com%3E%20(https%3A%2F%2Fionicabizau.net)&year=2016#license-mit
[website]: https://ionicabizau.net
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md
