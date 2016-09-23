from flask import Flask, request, jsonify, render_template, g, session
from feedfinder3 import find_feeds, FeedInfo
import time
import re
import urllib
from pprint import pprint
import json
from marshmallow import Schema, fields
import time

app = Flask(__name__)

app.config['SECRET_KEY'] = 'blahblah'


comment_pattern = '\/comment(?:s)?(?:\/)?'
comment_regex = re.compile(comment_pattern)

excluded_domains = ['auctorial.com']

feed1 = FeedInfo(url='http://test.com')
feed1.subscribed = True
feed1.description = 'This is the first test feed.'

feed2 = FeedInfo(url='http://test2.com')
feed2.description = 'This is a test feed'
feed2.title = 'Test 2'


class FileInfoSchema(Schema):
    url = fields.String()
    site_url = fields.String()
    title = fields.String()
    description = fields.String()
    site_name = fields.String()
    site_icon_link = fields.String()
    subscribed = fields.Boolean()


@app.route('/')
def index():
    msg = 'Hello World 2'
    return render_template('index.html', msg=msg)


@app.route('/get', methods=['POST'])
def get():
    # urls = request.form.getlist('urlinput')
    urls = request.form.getlist('urls[]')
    print('Sent URLs: {0}'.format(urls))

    feeds = [feed1, feed2]
    not_found = []
    excluded = []
    session['feeds'] = []

    urls = set(urls)
    print('Set Urls: {0}'.format(urls))

    for url in urls:
        if not url:
            continue

        parsed = urllib.parse.urlparse(url)
        domain_root = parsed.netloc or parsed.path
        if domain_root in excluded_domains:
            print('Skipping url, excluded domain: {0}'.format(url))
            excluded.append(url)
            continue

        found = find_feeds(url, get_feedinfo=True)
        # found = find_feeds(url)
        print('Found feeds: {0}'.format(found))
        for f in found:
            print(f)
            if not comment_regex.search(f.url) and not f in feeds:
                feeds.append(f)

        if not found:
            not_found.append(url)

    file_info_schema = FileInfoSchema(many=True)
    result = file_info_schema.dump(feeds)
    print('Feeds: {0}'.format(feeds))

    # serialized = list(f.serialize() for f in feeds)
    session['feeds'] = result.data
    session['feed_urls'] = list(f.url for f in feeds)
    print('Session feeds: {0}'.format(session['feeds']))

    return jsonify({"result": result.data})


@app.route('/save2', methods=['POST'])
def save2():
    print(request.mimetype)
    requested_feed = request.get_json()
    print('Requested feeds: {0}'.format(requested_feed))
    if requested_feed in session['feed_urls']:
        return jsonify({'subscribed': requested_feed})
    return jsonify({'subcribed': None})


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


@app.route('/test', methods=['POST'])
def test():
    print(request.mimetype)
    print(request.form)

    print(request.get_json())
    urls = request.form.getlist('urls[]')
    print(urls)

    return jsonify({"urls": urls})


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
