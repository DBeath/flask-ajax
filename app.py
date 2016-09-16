from flask import Flask, request, jsonify, render_template, g, session
from feedfinder2 import find_feeds
import time
import re
import urllib
from pprint import pprint
from parser.py import get_feed_details

app = Flask(__name__)

app.config['SECRET_KEY'] = 'blahblah'


comment_pattern = '\/comment(?:s)?(?:\/)?'
comment_regex = re.compile(comment_pattern)

excluded_domains = ['auctorial.com']


@app.route('/')
def index():
    msg = 'Hello World 2'
    return render_template('index.html', msg=msg)


@app.route('/get', methods=['POST'])
def get():
    urls = request.form.getlist('urlinput')
    print('Sent URLs: {0}'.format(urls))

    feeds = []
    not_found = []
    excluded = []
    session['feeds'] = []

    for url in urls:
        if not url:
            continue

        parsed = urllib.parse.urlparse(url)
        domain_root = parsed.netloc or parsed.path
        if domain_root in excluded_domains:
            print('Skipping url, excluded domain: {0}'.format(url))
            excluded.append(url)
            continue

        found = find_feeds(url)
        print('Found feeds: {0}'.format(found))
        for f in found:
            print(f)
            if not comment_regex.search(f):
                feeds.append(f)

        if not found:
            not_found.append(url)

    print('Feeds: {0}'.format(feeds))
    session['feeds'] = feeds
    print('Session feeds: {0}'.format(session['feeds']))

    return jsonify({'result': feeds,
                    'not_found': not_found,
                    'excluded': excluded})


@app.route('/save', methods=['POST'])
def save():
    print(request.mimetype)
    requested_feeds = request.get_json()
    print('Requested feeds: {0}'.format(requested_feeds))

    to_subscribe = []
    for f in requested_feeds:
        if f in session['feeds']:
            to_subscribe.append(f)

    # send subscription request
    print('To Subscribe: {0}'.format(to_subscribe))
    return jsonify({'subscribed': to_subscribe})


@app.before_request
def before_request():
    g.start = time.time()


@app.after_request
def after_request(response):
    if 'start' in g:
        response_time = (time.time() - g.start)
    else:
        response_time = 0

    response_time_in_ns = int(response_time * 1000)

    params = {
        'method': request.method,
        'in': response_time_in_ns,
        'url': request.path,
        'ip': request.remote_addr,
        'status': response.status
    }

    app.logger.info('%(method)s "%(url)s" %(status)s in %(in)sms for %(ip)s',
                    params)

    return response
