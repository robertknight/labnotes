///<reference path="../node_modules/typescript/bin/lib.es6.d.ts" />
///<reference path="../typings/tsd.d.ts" />

import * as fs from 'fs';
import * as Q from 'q';
import * as request from 'request';
import * as fs_extra from 'fs-extra';

var hogan = require('hogan');
var FeedParser = require('feedparser');
var RSS = require('rss');

interface FeedConfig {
	url: string;
	name: string;
	image: string;
}

interface PlanetAuthors {
	[name: string]: FeedConfig;
}

interface PlanetConfig {
	rssOptions: RSSFeedOptions;
	authors: PlanetAuthors;
	templates: {[name:string]: string};
}

interface FeedMetadata {
}

interface FeedResult {
	meta: FeedMetadata;
	items: FeedItem[];
}

interface FeedMap {
	[name: string]: FeedResult;
}

interface FeedItem {
	title: string;
	pubdate: string;
	description: string;
	link: string;
	guid: string;
}

interface ItemFromAuthor {
	authorKey: string;
	item: FeedItem;
}

// See 'feedOptions' documentation at
// https://www.npmjs.com/package/rss
interface RSSFeedOptions {
	title: string;
	description: string;
	feed_url: string;
	site_url: string;
	image_url: string;
	webMaster: string;
}

// Entry for the feed items in the 'rss' library
// See 'itemOptions' description at https://www.npmjs.com/package/rss
interface RSSItem {
	title: string;
	description: string;
	url: string;
	guid: string;
	author: string;
	date: Date;
}

function readConfig(path: string) {
	return <PlanetConfig>JSON.parse(fs.readFileSync(path,'utf-8'));
}

function fetchFeeds(config: PlanetConfig) {
	let items = Q.defer<FeedMap>();

	let feeds: FeedMap = {};
	let fetches: Q.Promise<{}>[] = [];

	Object.keys(config.authors).forEach(name => {
		let fetch = Q.defer<FeedResult | Error>();
		fetches.push(fetch.promise);

		let feedParser = new FeedParser([]);
		let feed = config.authors[name];
		let feedReq = request(feed.url);
		let items: FeedItem[] = [];
		let meta: FeedMetadata;

		feedReq.on('error', err => {
			console.error('Failed to fetch %s: %s', err);
		});
		feedReq.on('response', res => {
			res.pipe(feedParser);
		});

		feedParser.on('error', err => {
			fetch.resolve(err);
			console.error('error parsing feed %s: %s', feed.url, err);
		});
		feedParser.on('readable', () => {
			let item: FeedItem;
			meta = feedParser.meta;
			while (item = feedParser.read()) {
				items.push(item);
			}
		});
		feedParser.on('end', () => {
			let feedResult = { meta: meta, items: items };
			feeds[name] = feedResult;
			fetch.resolve(feedResult);
			console.log('finished parsing %s', feed.url);
		});
	});

	return Q.all(fetches).then(() => {
		return feeds;
	});
}

function generateRSSFeed(config: PlanetConfig, items: ItemFromAuthor[]) {
	let aggregatedFeed: any = new RSS(config.rssOptions);
	for (let item of items) {
		let authorFeed = config.authors[item.authorKey];
		aggregatedFeed.item({
			title: item.item.title,
			description: item.item.description,
			author: authorFeed.name,
			url: item.item.link,
			date: Date.parse(item.item.pubdate),
			guid: item.item.guid
		});
	}
	return aggregatedFeed.xml({indent: true});
}

function generateFeedHTML(config: PlanetConfig, items: ItemFromAuthor[]) {
	let context = {
		title: config.rssOptions.title,
		description: config.rssOptions.description,
		feedURL: config.rssOptions.feed_url,
		items: items.map(item => {
			let date = <any>(new Date(Date.parse(item.item.pubdate)));
			let dateStr = <string>date.toLocaleDateString({},{
				weekday: 'short',
				day: 'numeric',
				month:'short',
				year: 'numeric'
			});
			let authorFeed = config.authors[item.authorKey];
			return {
				author: authorFeed.name,
				authorImageURL: authorFeed.image,
				title: item.item.title,
				url: item.item.link,
				content: item.item.description,
				date: dateStr
			};
		})
	};
	let template = fs.readFileSync(config.templates['main']).toString();
	return hogan.compile(template).render(context);
}

function main() {
	let config = readConfig('config.js');
	let items = fetchFeeds(config);
	let outputDir = 'output';
	fs_extra.mkdirsSync(outputDir);

	items.then(feeds => {
		// sort entries in chronological order
		let aggregatedItems: ItemFromAuthor[] = [];

		// aggregate and generate RSS
		for (name of Object.keys(feeds)) {
			console.log('fetched %d items from %s', feeds[name].items.length, name);
			for (let item of feeds[name].items) {
				aggregatedItems.push({
					authorKey: name,
					item: item
				});
			};
		}

		aggregatedItems.sort((a, b) => {
			let dateA = Date.parse(a.item.pubdate);
			let dateB = Date.parse(b.item.pubdate);

			if (dateA == dateB) {
				return 0;
			} else {
				return dateA > dateB ? -1 : 1;
			}
		});

		const MAX_ITEMS = 25;
		let mostRecentItems = aggregatedItems.slice(0, MAX_ITEMS);

		// generate RSS feed
		fs.writeFileSync(`${outputDir}/feed.xml`, generateRSSFeed(config, mostRecentItems));

		// generate HTML view
		fs.writeFileSync(`${outputDir}/index.html`, generateFeedHTML(config, mostRecentItems));
		
		// generate a feed per author
		for (name of Object.keys(feeds)) {
			fs.writeFileSync(`${outputDir}/${name}.html`, generateFeedHTML(config, aggregatedItems.filter(item => {
				return item.authorKey == name;
			})));
		}
		
	}).catch(err => {
		console.error('generating planet failed: ', err);
	});
}

main();

