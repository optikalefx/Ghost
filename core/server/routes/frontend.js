var frontend    = require('../controllers/frontend'),
    config      = require('../config'),
    express     = require('express'),
    utils       = require('../utils'),
    api         = require('../api'),
    Models       = require('../models'),
    _            = require('lodash'),
    frontendRoutes;

frontendRoutes = function () {
    var router = express.Router(),
        subdir = config.paths.subdir;

    // ### Admin routes
    router.get(/^\/(logout|signout)\/$/, function redirect(req, res) {
        /*jslint unparam:true*/
        res.set({'Cache-Control': 'public, max-age=' + utils.ONE_YEAR_S});
        res.redirect(301, subdir + '/ghost/signout/');
    });
    router.get(/^\/signup\/$/, function redirect(req, res) {
        /*jslint unparam:true*/
        res.set({'Cache-Control': 'public, max-age=' + utils.ONE_YEAR_S});
        res.redirect(301, subdir + '/ghost/signup/');
    });

    // redirect to /ghost and let that do the authentication to prevent redirects to /ghost//admin etc.
    router.get(/^\/((ghost-admin|admin|wp-admin|dashboard|signin|login)\/?)$/, function (req, res) {
        /*jslint unparam:true*/
        res.redirect(subdir + '/ghost/');
    });

    // ### Frontend routes
    router.get('/rss/', frontend.rss);
    router.get('/rss/:page/', frontend.rss);
    router.get('/feed/', function redirect(req, res) {
        /*jshint unused:true*/
        res.set({'Cache-Control': 'public, max-age=' + utils.ONE_YEAR_S});
        res.redirect(301, subdir + '/rss/');
    });

    // Tags
    router.get('/tag/:slug/rss/', frontend.rss);
    router.get('/tag/:slug/rss/:page/', frontend.rss);
    router.get('/tag/:slug/page/:page/', frontend.tag);
    router.get('/tag/:slug/', frontend.tag);

    // Authors
    router.get('/author/:slug/rss/', frontend.rss);
    router.get('/author/:slug/rss/:page/', frontend.rss);
    router.get('/author/:slug/page/:page/', frontend.author);
    router.get('/author/:slug/', frontend.author);

    // Default
    router.get('/page/:page/', frontend.homepage);
    router.get('/', function(req,res) {
        res.redirect("/home");
    });
    router.get('/blog', frontend.homepage);
    router.get('*', frontend.single);

    router.post('/contact-submit', function(req,res) {
        var fields = req.body;
        var html = "<table width='100%'>";
        _.forEach(fields, function(value, field) {
        	html += "<tr><th align='left'>" + field + "</th><td>" + value + "</td></tr>";
        });
        html += "</table>";
        fields = html;

        return Models.User.findOne({slug: "contact"}).then(function (result) {
            return api.mail.generateContent({template: 'contact', data: {
            	fields : fields
            }}).then(function (emailContent) {
                var payload = {mail: [{
                    message: {
                        to: result.get('email'),
                        subject: 'New contact from Comedtech',
                        html: emailContent.html,
                        text: emailContent.text
                    }
                }]};
                api.mail.send(payload,{context: {internal: true}});
                res.json(true);
            });
        }, function () {
            return Promise.reject('Could not find the current user');
        });
	});

    return router;
};

module.exports = frontendRoutes;
