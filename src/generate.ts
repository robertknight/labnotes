///<reference path="../node_modules/typescript/bin/lib.es6.d.ts" />
///<reference path="../typings/tsd.d.ts" />

import * as fs from 'fs';
import * as Q from 'q';
import * as request from 'request';

var FeedParser = require('feedparser');

interface FeedConfig {
	url: string;
	name: string;
	image: string;
}

interface PlanetConfig {
    [name: string]: FeedConfig
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
}

interface ItemFromAuthor {
	authorKey: string;
	item: FeedItem;
}

function readConfig(path: string) {
	return <PlanetConfig>JSON.parse(fs.readFileSync(path,'utf-8'));
}

function fetchFeeds(config: PlanetConfig) {
	let items = Q.defer<FeedMap>();

	let feeds: FeedMap = {};
	let fetches: Q.Promise<{}>[] = [];

	Object.keys(config).forEach(name => {
		let fetch = Q.defer<FeedResult | Error>();
		fetches.push(fetch.promise);

		let feedParser = new FeedParser([]);
		let feed = config[name];
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

function main() {
	let config = readConfig('config.js');
	let items = fetchFeeds(config);
	items.then(feeds => {
		// sort entries in chronological order
		let aggregatedFeed: ItemFromAuthor[] = [];

		// aggregate and generate RSS
		for (name of Object.keys(feeds)) {
			console.log('fetched %d items from %s', feeds[name].items.length, name);
			for (let item of feeds[name].items) {
				aggregatedFeed.push({
					authorKey: name,
					item: item
				});
			};
		}

		aggregatedFeed.sort((a, b) => {
			let dateA = Date.parse(a.item.pubdate);
			let dateB = Date.parse(b.item.pubdate);

			if (dateA == dateB) {
				return 0;
			} else {
				return dateA > dateB ? -1 : 1;
			}
		});

		const MAX_ITEMS = 25;
		for (let item of aggregatedFeed.slice(0, MAX_ITEMS)) {
			let name = config[item.authorKey].name;
			console.log('%s (%s)', name, item.item.title, item.item.pubdate);
		}
	}).catch(err => {
		console.error('generating planet failed: ', err);
	});
}

main();

