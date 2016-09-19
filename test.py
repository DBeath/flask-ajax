from pprint import pprint
from feedfinder3 import find_feeds
import urllib
import logging

logging.basicConfig(level=logging.INFO)

# url = 'http://boingboing.net/feed'
# url = 'http://boingboing.net'
# url = 'http://davidbrin.blogspot.com'
url = 'xkcd.com'

infos = find_feeds(url, get_feedinfo=True)

pprint(infos)

if infos:
    for i in infos:
        pprint(vars(i))
