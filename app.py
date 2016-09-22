from flask import Flask, request, jsonify, render_template, g, session
from feedfinder3 import find_feeds
import time
import re
import urllib
from pprint import pprint

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

        found = find_feeds(url, get_feedinfo=True)
        # found = find_feeds(url)
        print('Found feeds: {0}'.format(found))
        for f in found:
            print(f)
            if not comment_regex.search(f.url):
                feeds.append(f)

        if not found:
            not_found.append(url)

    print('Feeds: {0}'.format(feeds))
    session['feeds'] = list(f.serialize() for f in feeds)
    print('Session feeds: {0}'.format(session['feeds']))

    return jsonify({'result': list(f.serialize() for f in feeds),
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
