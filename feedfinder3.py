#!/usr/bin/env python
# -*- coding: utf-8 -*-

import logging
import requests
import json
from bs4 import BeautifulSoup
import feedparser
from six.moves.urllib import parse as urlparse

__version__ = "0.0.1"


def coerce_url(url):
    url = url.strip()
    if url.startswith("feed://"):
        return "http://{0}".format(url[7:])
    for proto in ["http://", "https://"]:
        if url.startswith(proto):
            return url
    return "http://{0}".format(url)


class FeedInfo(object):

    def __init__(self, url=None, site_url=None):
        self.url = url
        self.site_url = site_url

    def __repr__(self):
        return 'FeedInfo: {0}'.format(self.url)

    def get_info(self, text=None, soup=None):
        if text:
            parsed = self.parse_feed(text)
            self.title = self.feed_title(parsed)
            self.description = self.feed_description(parsed)
        if soup:
            self.site_name = self.find_site_name(soup)
            self.site_url = self.find_site_url(soup, self.site_url)
            self.site_icon_link = self.find_site_icon_link(soup, self.site_url)

    @staticmethod
    def parse_feed(text):
        return feedparser.parse(text)

    def feed_title(self, parsed):
        title = parsed.feed.get('title', None)
        if not title:
            return
        return self.clean_title(title)

    @staticmethod
    def clean_title(title):
        try:
            title = BeautifulSoup(title, 'html.parser').get_text()
            if len(title) > 1024:
                title = title[:1020] + u'...'
            return title
        except Exception as e:
            logging.exception(u'Failed to clean title: {0}'.format(e))

    @staticmethod
    def feed_description(parsed):
        subtitle = parsed.feed.get('subtitle', None)
        if subtitle:
            return subtitle
        else:
            return parsed.feed.get('description', None)

    @staticmethod
    def find_site_name(soup):
        site_name_meta = ['og:site_name',
                          'og:title',
                          'application:name',
                          'twitter:app:name:iphone']

        for p in site_name_meta:
            try:
                name = soup.find(name='meta', property=p).get('content')
                if name:
                    return name
            except:
                pass
        return None

    @staticmethod
    def find_site_url(soup, url):
        try:
            site = soup.find(name='link', rel='canonical').get('href')
            if site:
                return site
        except:
            pass
        try:
            site = soup.find(name='meta', property='og:url').get('content')
            if site:
                return site
        except:
            return url

    @staticmethod
    def find_site_icon_link(soup, url):
        icon_rel = ['shortcut icon',
                    'icon',
                    'apple-touch-icon']

        icon = None
        for r in icon_rel:
            rel = soup.find(name='link', rel=r)
            if rel:
                icon = rel.get('href', None)
                if icon[0] == '/':
                    icon = url + icon
                if icon == 'favicon.ico':
                    icon = url + '/' + icon
        if not icon:
            r = requests.get(url + '/favicon.ico')
            if r.status_code == requests.codes.ok:
                icon = r.url
        return icon

    def serialize(self):
        # return {
        #     'url': self.url,
        #     'site_url': self.site_url,
        #     'site_name': self.site_name,
        #     'site_icon_link': self.site_icon_link,
        #     'description': self.description,
        #     'title': self.title
        # }
        return json.dumps(self, default=lambda o: o.__dict__,
                          sort_keys=True, indent=4)


class FeedFinder(object):

    def __init__(self, user_agent=None, get_feedinfo=False):
        if user_agent is None:
            user_agent = "feedfinder3/{0}".format(__version__)
        self.user_agent = user_agent
        self.get_feedinfo = get_feedinfo
        self.url = None
        self.feeds = []
        self.text = None
        self.soup = None

    def get_url(self, url):
        try:
            r = requests.get(url, headers={"User-Agent": self.user_agent},
                             timeout=10)
        except Exception as e:
            logging.warn("Error while getting URL '{0}': {1}".format(url, e))
            return None
        return r.text

    def is_feed_data(self, text):
        data = text.lower()
        if data.count('<html'):
            return False
        return data.count('<rss') + data.count('<rdf') + data.count('<feed')

    def is_feed(self, url):
        text = self.get_url(url)
        if text is None:
            return None
        if self.is_feed_data(text):
            return text
        return None

    def is_feed_url(self, url):
        return any(map(url.lower().endswith,
                       [".rss", ".rdf", ".xml", ".atom"]))

    def is_feedlike_url(self, url):
        return any(map(url.lower().count,
                       ["rss", "rdf", "xml", "atom", "feed"]))

    def create_feedinfo(self, url, text, soup=None):
        info = FeedInfo(url)
        if self.get_feedinfo:
            print('Getting FeedInfo for {0}'.format(url))
            info.site_url = self.url
            info.get_info(text, self.soup)
        self.feeds.append(info)

    def check_urls(self, urls):
        for url in urls:
            url_text = self.is_feed(url)
            if url_text:
                self.create_feedinfo(url, url_text, self.soup)


def find_feeds(url, check_all=False, user_agent=None, get_feedinfo=False):

    finder = FeedFinder(user_agent=user_agent, get_feedinfo=get_feedinfo)

    # Format the URL properly.
    url = coerce_url(url)
    finder.url = url

    # Download the requested URL
    logging.info('Finding feeds at URL: {0}'.format(url))
    text = finder.get_url(url)
    if text is None:
        return []

    # Check if it is already a feed.
    if finder.is_feed_data(text):
        finder.soup = BeautifulSoup(text, 'html.parser')
        finder.create_feedinfo(url, text, finder.soup)
        return finder.feeds

    logging.info("Looking for <link> tags.")
    if not finder.soup:
        finder.soup = BeautifulSoup(text, 'html.parser')
    links = []
    for link in finder.soup.find_all("link"):
        if link.get("type") in ["application/rss+xml",
                                "text/xml",
                                "application/atom+xml",
                                "application/x.atom+xml",
                                "application/x-atom+xml"]:
            links.append(urlparse.urljoin(url, link.get("href", "")))

    # Check the detected links.
    finder.check_urls(links)
    logging.info("Found {0} feed <link> tags.".format(len(finder.feeds)))
    if len(finder.feeds) and not check_all:
        return sort_urls(finder.feeds)

    # Look for <a> tags.
    logging.info("Looking for <a> tags.")
    local, remote = [], []
    for a in finder.soup.find_all("a"):
        href = a.get("href", None)
        if href is None:
            continue
        if "://" not in href and finder.is_feed_url(href):
            local.append(href)
        if finder.is_feedlike_url(href):
            remote.append(href)

    # Check the local URLs.
    local = [urlparse.urljoin(url, l) for l in local]
    finder.check_urls(local)
    logging.info("Found {0} local <a> links to feeds.".format(len(finder.feeds)))
    if len(finder.feeds) and not check_all:
        return sort_urls(finder.feeds)

    # Check the remote URLs.
    remote = [urlparse.urljoin(url, l) for l in remote]
    finder.check_urls(remote)
    logging.info("Found {0} remote <a> links to feeds.".format(len(finder.feeds)))
    if len(finder.feeds) and not check_all:
        return sort_urls(finder.feeds)

    # Guessing potential URLs.
    fns = ["atom.xml", "index.atom", "index.rdf", "rss.xml", "index.xml",
           "index.rss"]
    finder.check_urls(urlparse.urljoin(url, f) for f in fns)
    return sort_urls(finder.feeds)


def url_feed_prob(url):
    score = 0
    if "comments" in url:
        score -=3
    if "georss" in url:
        score -=2
    if "alt" in url:
        score -= 1
    kw = ["rss", "atom", "rdf", ".xml", "feed"]
    for p, t in zip(range(len(kw), 0, -1), kw):
        if t in url:
            score += p
    return score


def sort_urls(feeds):
    return sorted(list(set(feeds)), key=lambda x: url_feed_prob(x.url),
                  reverse=True)
