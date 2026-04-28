const https = require('https');

const API_KEY = '07740c047e40400e9faebe27e75b11f5';

module.exports = function handler(req, res) {
    const endpoint = req.query.endpoint;
    if (!endpoint || !endpoint.startsWith('/')) {
        return res.status(400).json({ error: 'Invalid endpoint' });
    }

    const options = {
        hostname: 'api.football-data.org',
        path: '/v4' + endpoint,
        method: 'GET',
        headers: { 'X-Auth-Token': API_KEY }
    };

    const request = https.request(options, function(response) {
        let data = '';
        response.on('data', function(chunk) { data += chunk; });
        response.on('end', function() {
            try {
                res.status(response.statusCode).json(JSON.parse(data));
            } catch (e) {
                res.status(500).json({ error: 'Parse error' });
            }
        });
    });

    request.on('error', function(e) {
        res.status(500).json({ error: 'Request failed', detail: e.message });
    });

    request.end();
};
