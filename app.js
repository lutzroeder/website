#!/usr/bin/env node

var fs = require("fs"); 
var http = require("http");
var os = require("os");
var path = require("path"); 
var url = require("url");

console.log(process.title)
console.log(process.version);

function Route(method, path, handler) {
    this.method = method;
    this.path = path;
    this.handler = handler;
}

Route.prototype.route = function(request, response, next) {
    var handler = this.handler;
    try {
        handler(request, response, next);
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}

function Router() {
    this.routes = [];
}

Router.prototype.route = function(request, response) {
    var method = request.method.toUpperCase();
    var pathname = url.parse(request.url, true).pathname;
    var index = 0;
    var routes = this.routes;
    var defaultHandler = this.defaultHandler;
    next();
    function next() {
        var route = routes[index++];
        if (route) {
            if (route.method === method && pathname.match(route.path) !== null) {
                if (route.handler) {
                    route.route(request, response, next);
                }
                else {
                    defaultHandler(request, response);
                }
            }
            else {
                next();
            }
        }
        else if (defaultHandler) {
            defaultHandler(request, response);
        }
    }
}

Router.prototype.get = function(path, handler) {
    this.routes.push(new Route("GET", path, handler));
}

Router.prototype.default = function(handler) {
    this.defaultHandler = handler;
}

var router = new Router();

router.default(function (request, response) {
    response.writeHead(302, { "Location": "/" });
    response.end();
});

router.get(/^\/admin$/i);
router.get(/^\/app.js$/i);
router.get(/^\/navigation.html$/i);
router.get(/^\/post.html$/i);
router.get(/^\/feed\/.+$/i);
router.get(/^\/package.json$/i);
router.get(/^\/web.config$/i);

// Render RSS feed
router.get(/^\/feed\/?/i, function(request, response, next) {
    var data = fs.readFileSync("feed/feed.xml", "utf-8");
    var entries = [];
    fs.readdirSync("blog/").sort().reverse().forEach(function (file, index) {
        var domain = request.headers.host.split(":").shift();
        var entry = loadPost("blog/" + file);
        if (entry && (entry["state"] == "post" || domain == "localhost" || domain == "127.0.0.1")) {
            entry["url"] = (request.secure ? "https" : "http") + "://" + request.headers.host + "/blog/" + path.basename(file, ".html");;
            entries.push("<entry>")
            entries.push("<id>" + entry["url"] + "</id>")
            entries.push("<author><name>" + entry["author"] + "</name></author>")
            var date = new Date(entry["date"] + " UTC").toISOString();
            entries.push("<published>" + date + "</published>")
            if (entry["updated"]) {
                entries.push("<updated>" + new Date(entry["updated"] + " UTC").toISOString() + "</updated>")
            }
            else {
                entries.push("<updated>" + date + "</updated>")
            }
            entries.push("<title type='text'>" + entry["title"] + "</title>")
            entries.push("<content type='html'>" + entry["content"].replace(/\</g, "&lt;").replace(/\>/g, "&gt;") + "</content>");
            entries.push("<link rel='alternate' type='text/html' href='" + entry["url"] + "' title='" + entry["title"] + "' />")
            entries.push("</entry>")
        }
    });
    var context = {};
    context["updated"] = new Date().toISOString();
    context["entries"] = entries.join("\n");
    data = data.replace(/\{\{\s*([-_\w]+)\s*\}\}/gm, function(match, value) {
        return context[value];
    });
    response.writeHead(200, { "Content-Type" : "text/html" });
    response.write(data);
    response.end();
});

// Render blog post
router.get(/^\/blog\/(.+)/i, function (request, response, next) {
    var pathname = url.parse(request.url, true).pathname.toLowerCase();
    var localPath = pathname.replace(/^\/?/, "") + ".html";
    var context = loadPost(localPath);
    if (context) {
        var date = new Date(context["date"]);
        context["date_text"] = date.toLocaleDateString("en-US", { month: "short"}) + " " + date.getDate() + ", " + date.getFullYear();
        var template = fs.readFileSync("post.html", "utf-8");
        var data = template.replace(/\{\{\s*([-_\/\.\w]+)\s*\}\}/gm, function(match, value) {
            if (value.startsWith("/") || value.startsWith("./") || value.startsWith("../")) {
                return fs.readFileSync(value, "utf-8");
            }
            return context[value];
        });
        response.writeHead(200, { "Content-Type" : "text/html" });
        response.write(data);
        response.end();
    }
    else {
        response.writeHead(302, { "Location": "/" });
        response.end();
    }
});

// Handle Let's Encrypt challenge
router.get(/^\/\.well\-known\/acme\-challenge\/(.+)/i, function (request, response, next) {
    var pathname = url.parse(request.url, true).pathname;
    var localPath = pathname.replace(/^\/?/, "");
    if (fs.existsSync(localPath) && fs.statSync(localPath).isFile) {
        response.writeHead(200, { "Content-Type" : "text/plain; charset=utf-8" });
        response.write(fs.readFileSync(localPath, "utf-8"));
        response.end();
    } 
    else {
        response.writeHead(302, { "Location": "/" });
        response.end();
    }
});

router.get(/^.*$/i, function (request, response, next) {
    var mimeTypeMap = {
        ".js":   "text/javascript",
        ".css":  "text/css",
        ".png":  "image/png",
        ".gif":  "image/gif",
        ".jpg":  "image/jpeg",
        ".ico":  "image/vnd.microsoft.icon",
        ".xap":  "application/x-silverlight-app",
        ".ppt":  "application/vnd.ms-powerpoint",
        ".zip":  "application/zip",
        ".json": "application/json"
    };
    var pathname = url.parse(request.url, true).pathname.toLowerCase();
    var localPath = pathname.replace(/^\/?/, "");
    var extension = path.extname(localPath); 
    var contentType = mimeTypeMap[extension];
    if (contentType) {
        fs.stat(localPath, function (error, stats) {
            if (error || !stats.isFile()) {
                response.writeHead(302, { "Location": "/" });
                response.end();
            }
            else {
                var stream = fs.createReadStream(localPath);
                stream.on("error", function () {
                    response.writeHead(302, { "Location": "/" });
                    response.end();
                });
                stream.on("open", function () {
                    response.writeHead(200, { "Content-Type" : contentType });
                    stream.pipe(response);
                });
            }
        });
    }
    else {
        next();
    }    
});

router.get(/^\/.*$/i, function (request, response, next) {
    var pathname = url.parse(request.url, true).pathname.toLowerCase();
    var localPath = pathname;
    if (localPath.endsWith("/")) {
        localPath = localPath + "index.html";
    }
    localPath = localPath.replace(/^\/?/, "");
    fs.stat(localPath, function (error, stats) {
        if (error) {
            next();
            return;
        }
        if (stats.isDirectory() || path.extname(localPath) != ".html") {
            response.writeHead(302, { "Location": pathname + "/" });
            response.end();
            return;
        }
        fs.readFile(localPath, "utf8", function (error, data) {
            if (error) {
                next();
                return;
            }

            data = data.replace(/\{\{\s*([-_\/\.\w]+)\s*\}\}/gm, function (match, value) {
                if (value.startsWith("/") || value.startsWith("./") || value.startsWith("../")) {
                    var file = path.join(path.dirname(localPath), value);
                    return fs.readFileSync(file, "utf-8");
                }
                else if (value == "blog") {
                    var domain = request.headers.host.split(":").shift();
                    var output = [];
                    fs.readdirSync("blog/").sort().reverse().forEach(function (file, index) {
                        var entry = loadPost("blog/" + file);
                        if (entry && (entry["state"] == "post" || domain == "localhost" || domain == "127.0.0.1")) {
                            entry["id"] = path.basename(file, ".html");
                            entry["url"] = (request.secure ? "https" : "http") + "://" + request.headers.host + "/blog/" + entry["id"];
                            var date = new Date(entry["date"]);
                            entry["date_text"] = date.toLocaleDateString("en-US", { month: "short"}) + " " + date.getDate() + ", " + date.getFullYear();
                            var post = [];
                            post.push("<div class='item'>");
                            post.push("<div class='date'>" + entry["date_text"] + "</div>");
                            post.push("<h1><a href='" + entry["url"] + "'>" + entry["title"] + "</a></h1>");
                            var content = entry["content"];
                            content = content.replace(/\s\s/g, " ");
                            var truncated = truncateHtml(content, 320);
                            post.push("<p>" + truncated + "</p>");
                            if (truncated != content) {
                                post.push("<div class='more'><a href='" + entry["url"] + "'>" + "Read more&hellip;" + "</a></div>");
                            }
                            post.push("</div>");
                            output.push(post.join(""));
                        }
                    });
                    return output.join("<div class='separator'></div>")
                }
                return "{{ ? }}";
            });
            response.writeHead(200, { "content-type" : "text/html" });
            response.write(data);
            response.end();
        });       
    });
});

router.get(/.*/i, function (request, response) {
    response.writeHead(302, { "Location": "/" });
    response.end();
});

function loadPost(file) {
    var isFile;
    try {
        isFile = fs.statSync(file).isFile;
    }
    catch (error) {
        isFile = false;
    }
    if (isFile) {
        var data = fs.readFileSync(file, "utf-8");
        if (data) {
            var entry = {};
            var content = [];
            var lines = data.split(/\r\n?|\n/g); // newline
            var line = lines.shift();
            if (line && line.startsWith("---")) {
                while (true) {
                    line = lines.shift();
                    if (!line || line.startsWith("---")) {
                        break;
                    }
                    var index = line.indexOf(":");
                    if (index > -1) {
                        var name = line.slice(0, index).trim();
                        var value = line.slice(index + 1).trim();                        
                        if (value.startsWith('"') && value.endsWith('"')) {
                            value = value.slice(1, -1);
                        }
                        entry[name] = value;
                    }
                }
            }
            else {
                content.append(line);
            }
            content = content.concat(lines);
            entry["content"] = content.join('\n');
            return entry;
        }
    }
    return null;
}

function truncateHtml(text, length) {
    var entityEndRegEx = /(\w+;)/g;
    var position = 0;
    var index = 0;
    var pendingCloseTags = {};
    while (position < length && index < text.length) {
        if (text[index] == '<') {
            if (index in pendingCloseTags) {
                var skip = pendingCloseTags[index].length;
                delete pendingCloseTags[index];
                index += skip;
            }
            else {
                index++;
                var match = text.substring(index).match(/(\w+)[^>]*>/);
                if (match) {
                    index--;
                    var tag = match[1];
                    if (tag == "pre" || tag == "code") {
                        break;
                    }
                    index += match[0].length;
                    match = text.substring(index).match(new RegExp("</" + tag + "[^>]*>"));
                    if (match) {
                        pendingCloseTags[index + match.index] = match[0];
                    }
                }
                else {
                    position++;
                }
            }
        }
        else if (text[index] == '&') {
            index += 1;
            match = entityEndRegEx.match(text.substring(index));
            if (match) {
                index += match.end();
            }
            position += 1;
        }
        else {
            var next = text.substring(index, length);
            var skip = next.indexOf('<');
            if (skip == -1) {
                skip = next.indexOf('&');
            }
            if (skip == -1) {
                skip = index + length;
            }
            var delta = Math.min(skip, length - position, text.length - index);
            position += delta;
            index += delta;
        }

    }
    var output = [ text.substring(0, index) ];
    if (position == length) {
        output.push('&hellip;');
    }
    var keys = [];
    for (var key in pendingCloseTags) {
        keys.push(Number(key));
    }
    keys.sort();
    for (var i = 0; i < keys.length; i++) {
        output.push(pendingCloseTags[keys[i]])
    }
    return output.join("");
}

var server = http.createServer(function (request, response) {
    console.log(request.url);
    router.route(request, response);
});

var port = process.env.PORT || 8080;
server.listen(port, function() {
    console.log('http://localhost:' + port);
});
