from pprint import pprint
from feedfinder2_upgraded import find_feeds

url = 'boingboing.net'

urls, infos = find_feeds(url)

pprint(urls)

for i in infos:
    pprint(vars(i))
