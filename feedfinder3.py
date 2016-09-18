#!/usr/bin/env python
# -*- coding: utf-8 -*-

import logging
import requests
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

    def __init__(self, url=None):
        self.url = url

    def get_info(self, text):
        parsed = self.parse_feed
        self.title = self.feed_title(parsed)
        self.description = self.feed_description(parsed)
        self.site_name = self.site_name(text)

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
    def site_name(soup):
        site_name_meta = ['og:site_name',
                          'application:name',
                          'twitter:app:name:iphone']

        name = None
        for p in site_name_meta:
            meta = soup.find(name='meta', property=p)
            if meta:
                name = meta.get('content', None)
            if name:
                return name
        return None

    @staticmethod
    def site_url(soup, url):
        site = soup.find("link", rel="canonical")
        if not site:
            return url
        return site

    @staticmethod
    def site_icon_link(url, soup):
        icon_rel = ['shortcut icon',
                    'icon',
                    'apple-touch-icon']

        icon = None
        for r in icon_rel:
            rel = soup.find(name='link', rel=r)
            if rel:
                icon = rel.get('href', None)
        if not icon:
            r = requests.get(url + '/favicon.ico')
            if r.status_code == requests.codes.ok:
                icon = r.url
        return icon


class FeedFinder(object):

    def __init__(self, user_agent=None):
        if user_agent is None:
            user_agent = "feedfinder3/{0}".format(__version__)
        self.user_agent = user_agent
        self.feeds = []
        self.text = None

    def get_url(self, url):
        try:
            r = requests.get(url, headers={"User-Agent": self.user_agent})
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
        text = self.get_feed(url)
        if text is None:
            return None
        if self.is_feed_data(text):
            return True, text
        return False

    def is_feed_url(self, url):
        return any(map(url.lower().endswith,
                       [".rss", ".rdf", ".xml", ".atom"]))

    def is_feedlike_url(self, url):
        return any(map(url.lower().count,
                       ["rss", "rdf", "xml", "atom", "feed"]))

    def create_feedinfo(self, url, text):
        soup = BeautifulSoup(text, 'html.parser')
        info = FeedInfo(url, soup)
        self.feeds.append(info)


def find_feeds(url, check_all=False, user_agent=None, get_feedinfo=False):
    finder = FeedFinder(user_agent=user_agent)

    # Format the URL properly.
    url = coerce_url(url)

    # Download the requested URL.
    text = finder.get_feed(url)
    if text is None:
        return []

    # Check if it is already a feed.
    if finder.is_feed_data(text):
        return [url]
