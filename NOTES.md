# Basic Features

* Cool name (Planet Mendeley, something more science-y),
  memorable URL
* River-of-news from Mendeley staff blogs
 - For each item: Title, date, link, hackergotchi, summary
 - Mendeley design
* RSS feed that can be subscribed to in feedly

# Stretch Features

* Twitter account that retweets blog entries
* UI for managing feeds
 - Needs auth access

# Help Needed

* Naming: Need a good name and a URL
* Community: Survey of blogging, tumblr-ing etc. habits of Mendeley staff
* Design: Awesome mobile (& desktop) design
* Systems: URL that shows static content
* All: Ideas for content, features etc.

# Tech Design

* Git repo with JSON config file containing set of feeds to include
* Cron job that fetches current subscriptions, generates static
  RSS XML feed, HTML, log file and publishes to S3
* Use existing service for RSS -> Twitter (eg. twitterfeed) 

1. Fetch feeds, aggregate, generate planet

src/generate-feed.js <config file> <template dir> <output dir>
 => Fetch feeds
 => Generate aggregate feed
 => Generate planet HTML

Config file:

    interface PlanetConfig {
        [name: string]: FeedConfig
    }

    interface FeedConfig {
        url: string;
        name: string;
        images: [
            [size: number]: string; /* URL */
        ];
    }

Template:

2. Upload to S3

s3cmd put <...>

# Libs

Templates - http://twitter.github.io/hogan.js/
Feed parsing - https://www.npmjs.com/package/feedparser
Wrapper around feedparser - https://github.com/NicolaOrritos/hungry/blob/master/lib/hungry.js
RSS generator - https://www.npmjs.com/package/rss
S3 SDK - http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/
Bunyan logging

# Idea Brainstorm

- Tinder-esque interface for rating posts
- Comic strip theme
- Real-time updates
- Follow-on-Mendeley

