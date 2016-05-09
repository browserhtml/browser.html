# Contributing

We welcome contribution from everyone. Here are the guidelines if you are thinking of helping us:

Contributions to Browser.html or its dependencies should be made in the form of GitHub pull requests. Each pull request will be reviewed by a core contributor (someone with permission to land patches) and either landed in the main tree or given feedback for changes that would be required. All contributions should follow this format, even those from core contributors.

- [Hacking Browser.html](https://github.com/browserhtml/browserhtml/wiki/Hacking-Browser.html) has some helpful tips for developers.
- Looking for a [good first bug](https://github.com/browserhtml/browserhtml/labels/newcomers)?


## Pull request checklist

- Branch from the master branch and, if needed, rebase to the current master branch before submitting your pull request. If it doesn't merge cleanly with master you may be asked to rebase your changes.
- Commits should be as small as possible, while ensuring that each commit is correct independently (i.e., each commit should compile and pass tests).
- If your patch is not getting reviewed or you need a specific person to review it, you can @-reply a reviewer asking for a review in the pull request or a comment.


## Filing issues

The Browser.html has 2 major pieces:

- Graphene: a runtime for building native apps in HTML. It's currently in development and part of Servo. There is also a Gecko version.
- Browser.html: an experimental browser UI for desktop.

Development for the Browser.html UI happens in this repository. Work on Servo and Gecko happens in their respective repositories.

* For issues tagged [graphene (servo)](https://github.com/browserhtml/browserhtml/labels/graphene%20%28servo%29). If the issue is with Servo, [file in Servo repository](https://github.com/servo/servo/issues/).
* For issues tagged [graphene (gecko)](https://github.com/browserhtml/browserhtml/labels/graphene%20%gecko%29). Triage and file in [Bugzilla](http://bugzilla.mozilla.org/). When filed, post a link to issue and close.


## Conduct

We follow the [Rust Code of Conduct](https://www.rust-lang.org/conduct.html).


## Communication and resources

[![slack](https://browserhtml-slackin.herokuapp.com/badge.svg)](https://browserhtml-slackin.herokuapp.com/)

- Browser.html contributors hang out in [browserhtml.slack.com](https://browserhtml.slack.com). Anyone can [get an invite](https://browserhtml-slackin.herokuapp.com/).
- More information can be found on the [wiki](https://github.com/browserhtml/browserhtml/wiki)


## Philosophy

* Everything is a tradeoff. There is often more than one right answer.
* We take an iterative approach to engineering and design. The smaller the iteration loop, the faster and cheaper we can learn what works.
* [We try to understand "why"](https://en.wikipedia.org/wiki/5_Whys).
* We try to be pragmatic.
* We don't use the term "polish". It implies that quality is an afterthought.
