import feedparser


def get_feed_details(url):
    parsed = feedparser.parse(url)


