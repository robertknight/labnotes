#labnotes

labnotes is a simple river-of-news style feed aggregator,
built for Node.js.

It was built for a hackday project at [Mendeley](https://github.com/Mendeley).

Given a configuration file and HTML template, it fetches
a set of RSS feeds and generates:

 * An aggregated RSS feed containing the most recent posts
   from all the input feeds.
 * An HTML page displaying those posts

## Getting Started

The `examples/` directory contains simple examples showing how to define
and generate a feed using labnotes.

1. Clone this repository
2. Run `npm install`
3. Go to the `examples/apple-news` dir
4. Run `make feed`
5. Open `output/index.html` in your browser.

Additionally an RSS feed is generated in `output/feed.xml`

## Usage

1. Write a config.js file specifying the list of input feeds to fetch,
   the output feed metadata and templates to use for the HTML views.

   See `src/config.ts` for the structure of the config file.

2. Run `labnotes`, specifying the config file and the output directory

 ```sh
 npm install labnotes
 labnotes config.js output
 ```

3. Upload the contents of the output directory to wherever you want to host
   the RSS feed and the HTML pages.

To keep the feed updated, set up a cron or other scheduled job to run `labnotes`
on a regular basis and upload the results.
