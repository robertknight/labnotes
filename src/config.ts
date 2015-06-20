/// Type definitions for the config.js JSON file.
/// The input config.js file is a 'Config' object.

// See 'feedOptions' documentation at
// https://www.npmjs.com/package/rss
export interface RSSFeedOptions {
	title: string;
	description: string;
	feed_url: string;
	site_url: string;
	image_url: string;
	webMaster: string;
}

export interface InputFeed {
	url: string;
	name: string;
	image: string;
}

export interface InputFeeds {
	[name: string]: InputFeed;
}

export interface Config {
	rssOptions: RSSFeedOptions;
	authors: InputFeeds;
	templates: {[name:string]: string};
}


