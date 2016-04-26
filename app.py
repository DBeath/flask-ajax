from flask import Flask, request, jsonify, render_template
from feedfinder2 import find_feeds

app = Flask(__name__)


@app.route('/')
def index():
    msg = 'Hello World 2'
    return render_template('index.html', msg=msg)


@app.route('/get', methods=['POST'])
def get():
    urls = request.form.getlist('urlinput')
    print(urls)
    feeds = []
    for url in urls:
        found = find_feeds(url)
        feeds.extend(found)
    print(feeds)
    return jsonify({'result': feeds})


@app.route('/save', methods=['POST'])
def save():
    print(request.mimetype)
    feeds = request.get_json(force=True)
    print(feeds)
    msg = u'Saved feeds: {0}'.format(feeds)
    return jsonify({'message': msg})

if __name__ == '__main__':
    app.run(debug=True)
