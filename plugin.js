const http = require('http');
const https = require('https');
const URL = require('url');
const fs = require('fs');

function get_token(authenticate_url, authenticate_payload) {
    const b = URL.parse(authenticate_url);
    const body = JSON.stringify(authenticate_payload);
    const options = {
	protocol: b.protocol,
	hostname: b.host,
	path: b.path,
	method: 'POST',
	headers: {
	    'Content-Type': 'application/json',
	    'Content-Length': Buffer.byteLength(body),
	}
    }
    const module = b.protocol === 'http:' ? http : https;
    const req = module.request(options, res => {
	res.setEncoding('utf8');
	var buffer = '';
	res.on('data', chunk => {
	    buffer += chunk;
	});
	res.on('end', () => {
	    const body = JSON.parse(buffer);
	    const access_token = body.access_token;
	    alert('TOKEN:' + access_token);
	    tokens[authenticate_url] = access_token;
	    save();
	});
    });
    req.write(body);
    req.end();
}

const config = __dirname + "/config";

function load() {
    try {
	const content = fs.readFileSync(config);
	return JSON.parse(content);
    } catch (err) {
	return {};
    }
}

function save() {
    try {
	const content = JSON.stringify(tokens);
	fs.writeFileSync(config, content);
    } catch (err) {
    }
}

const tokens = load();

module.exports.requestHooks = [
    context => {
	const request = context.request;
	if (!request.hasHeader("Authorization")) {
	    const authenticate_url = request.getEnvironmentVariable("authenticate_url");
	    const authenticate_payload = request.getEnvironmentVariable("authenticate_payload");
	    if (tokens[authenticate_url]) {
		request.setHeader("Authorization", "Bearer " + tokens[authenticate_url]);
	    } else {
		get_token(authenticate_url, authenticate_payload);
	    }
	}
    }
]
