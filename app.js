// Import the http library

// var app = require('express')();
// var http = require('http').Server(app);
// var io = require('socket.io')(http);



var http = require('http').Server(app);
var file_system = require('fs');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('music.db');
var path = require('path');
var models = require('./models');
const bcrypt = require('bcrypt');

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var crypto = require('crypto');

// Socket.io
var io = require('socket.io')(http);


var app = express();
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

app.use(cookieParser());



// getPlaylists function handles playlists requests
var getPlaylists = function(reuqest, response) {

    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html');
    response.setHeader('Cache-Control', 'public,max-age = 1800');

    file_system.readFile(__dirname + '/playlist.html', function(err, data) {

        if (err) {
            console.log("ERROR: failed to load playlists.html");
        }

        response.end(data);
    });
}



//getRedirect fot requests with '/' URLs
// var getRedirect = function(request, response) {
//     response.statusCode = 301;
//     response.setHeader('Location', '/playlists');
//     response.end('/playlists');
// };



//getStyle fuction handles to the style.css requests
var getStyle = function(request, response) {

    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/css');
    response.setHeader('Cache-Control', 'public, max-age = 1800');

    file_system.readFile(__dirname + '/playlist.css', function(err, data) {

        if (err) {
            console.log('ERROR: failed to load style.css');
        }

        response.end(data);
    });
}




//getMusicAppJs function handles the request for front-end JS file
var getMusicAppJs = function(request, response) {

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/javascript');
    response.setHeader('Cache-Control', 'public,max-age = 1800');

    file_system.readFile(__dirname + '/music-app.js', function(err, data) {
        if (err) {
            console.log('ERROR: failed to load music-app.js');
        }

        response.end(data);
    });
}




//getResetCSS function handles the request for reset.css file
var getResetCSS = function(request, response) {

    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/css');
    response.setHeader('Cache-Control', 'public,max-age = 1800');

    file_system.readFile(__dirname + '/reset.css', function(err, data) {
        if (err) {
            console.log('ERROR: failed to load reset.css');
        }

        response.end(data);
    });
}




//getFavicon function handles the request for favicon.ico file
var getFavicon = function(request, response) {

    response.statusCode = 200;
    response.setHeader('Content-Type', 'image/x-icon');
    response.setHeader('Cache-Control', 'public,max-age = 1800');

    file_system.readFile(__dirname + '/favicon.ico', function(err, data) {
        if (err) {
            console.log('ERROR: failed to load favicon');
        }

        response.end(data);
    });
}




//getAlbumCover function handles the request album_cover.jpg file
var getAlbumCover = function(request, response) {

    response.statusCode = 200;
    response.setHeader('Content-Type', 'image/jpg');
    response.setHeader('Cache-Control', 'public,max-age = 1800');

    file_system.readFile(__dirname + '/album_cover.jpg', function(err, data) {
        if (err) {
            console.log('ERROR: failed to load album_cover.jpg');
        }

        response.end(data);
    });
}




//getSongsData function handles the request songs.json file
var getSongsData = function(request, response) {

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'public,max-age = 1800');


    // USE ORM
    models.Song.findAll()
        .then(function(songs) {
            var songs_object = JSON.stringify(songs.map(function(song) {
                return song.get({
                    plain: true
                })
            }));

            var songs_json_object = '{ "songs":' + songs_object + '}';
            response.end(songs_json_object);
        })
}



//getPlaylistsData function handles the request playlists.json file
var getPlaylistsData = function(request, response) {

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'public,max-age = 1800');

    var songs_array;
    var count = 0;
    var playlists_object = []

    // find the user id from sessionKey
    models.Session.findOne({
        where: {
            sessionKey: request.cookies.sessionToken
        }
    }).then(function(session) {

        var userID = session.sessionUser;

        models.User.findOne({
            where: {
                id: userID
            }
        }).then(function(userInstance) {

            userInstance.getPlaylists().then(function(playlistsInstance) {
                playlistsInstance.forEach(function(playlistInstance) {
                    playlistInstance.getSongs().then(function(songs_list) {

                        count++;
                        songs_array = songs_list.map(function(song) {
                            return song.get({
                                plain: true
                            })
                        });

                        songs_array = songs_array.map(function(song) {
                            return song.id;
                        })

                        var playlistData = playlistInstance.get({
                            plain: true
                        });

                        playlistData.songs = songs_array;
                        playlists_object.push(playlistData);

                        if (count === playlistsInstance.length) {
                            // console.log(playlists_object);
                            response.end(JSON.stringify({
                                'playlists': playlists_object
                            }));
                        }
                    })
                });
            });
        });

    });

}



//addPlaylist function add playlist to DB
var addPlaylist = function(request, response) {



    models.Playlist.create(request.body)
        .then(function(createdPlaylist) {
            var newPlaylist = createdPlaylist.get({
                plain: true
            })

            response.statusCode = 200;
            response.end(JSON.stringify(newPlaylist));
        })

}

var idExists = function(pl_ids, playlist_id) {
    var id_exist = false;
    for (i in pl_ids) {

        if (pl_ids[i] == playlist_id) {
            id_exist = true;
        }
    }

    return id_exist;
}

// addSong function adds song to a playlist
var addSong = function(request, response) {

    var song_id = request.body.song;
    var playlist_id = request.params['id'];

    // find the user id from sessionKey
    models.Session.findOne({
        where: {
            sessionKey: request.cookies.sessionToken
        }
    }).then(function(session) {

        var userID = session.sessionUser;

        models.User.findOne({
            where: {
                id: userID
            }
        }).then(function(userInstance) {

            userInstance.getPlaylists().then(function(playlistsInstance) {

                var pl_ids = [];
                playlistsInstance.forEach(function(playlistInstance) {
                    pl_ids.push(playlistInstance.id);
                });


                if (idExists(pl_ids, playlist_id)) {
                    models.Playlist.findById(playlist_id)
                        .then(function(playlist) {

                            playlist.addSong(song_id).then(function() {
                                response.statusCode = 200;
                                response.end();
                            });
                        })
                } else {

                    response.statusCode = 403;
                    response.end();

                }

            });
        });

    });

}


// DELETE SONG FROM A PLAYLIST
var removeSong = function(request, response) {

    var song_id = request.body.song;
    var playlist_id = request.params['id'];

    // find the user id from sessionKey
    models.Session.findOne({
        where: {
            sessionKey: request.cookies.sessionToken
        }
    }).then(function(session) {

        var userID = session.sessionUser;

        models.User.findOne({
            where: {
                id: userID
            }
        }).then(function(userInstance) {

            userInstance.getPlaylists().then(function(playlistsInstance) {

                var pl_ids = [];
                playlistsInstance.forEach(function(playlistInstance) {

                    pl_ids.push(playlistInstance.id);
                });


                if (idExists(pl_ids, playlist_id)) {
                    models.Playlist.findById(playlist_id)
                        .then(function(playlist) {

                            playlist.removeSong(song_id).then(function() {
                                response.statusCode = 200;
                                response.end();
                            });
                        })
                } else {

                    response.statusCode = 403;
                    response.end();

                }

            });
        });

    });
}


// Hash Key Generator
var generateKey = function() {
    var sha = crypto.createHash('sha256');
    sha.update(Math.random().toString());
    return sha.digest('hex');
};


// Check if username  and pass is in DB and create a session for user

var userManagement = function(request, response) {
    var name = request.body['name'];
    var password = request.body['password'];
    var pass_flag = false;

    // heck if the username exist in DB and Pass is correct
    models.User.findOne({
        where: {
            username: name
        }
    }).then(function(user) {

        if (bcrypt.compareSync(password, user.password)) {
            pass_flag = true;
        }

        if (user !== null && user.username === name && pass_flag) {

            var newSessionKey = generateKey();
            models.Session.create({
                    sessionKey: newSessionKey,
                    sessionUser: user.id
                })
                .then(function(session) {

                    response.statusCode = 301;
                    response.setHeader('Location', '/playlists');
                    response.set('Set-Cookie', 'sessionToken=' + session.sessionKey);
                    response.end();

                });


        } else {
            response.statusCode = 401;
            response.end("<h1>Access denied - Wrong Username or Password!</h1>");
        }
    });
}





// Get the list of all users and response to the req.
var getUsersList = function(request, response) {

    var usersObj = {};

    models.User.findAll({
        attributes: ['id', 'username']
    }).then(function(users){
        var usersArray = users.map(function(user) {
            return user.get({
                plain: true
            })
        });

        usersObj["users"] = usersArray;

        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(usersObj));

    });
}




// // Authentication midleware
app.use(function(request, response, next) {
    console.log(request.url)
    var sessionToken = request.cookies.sessionToken;


    if (request.url === '/playlist.css' || request.url === '/login') {
        next();
        return;
    } else {

        models.Session.findOne({
            where: {
                sessionKey: sessionToken
            }
        }).then(function(session) {
            if (sessionToken !== null && session !== null) {
                if (sessionToken === session.sessionKey) {
                    next();
                }

            } else {
                response.redirect('/login');
                next();
            }
        });
    }
});




// HANDLE REQUESTS USING express

app.get('/login', function(request, response) {
    response.sendFile(path.join(__dirname, 'login.html'))
});

app.post('/login', function(request, response) {
    userManagement(request, response);
});

app.get('/', function(request, response) {
    response.redirect(301, '/playlists');
});

app.get('/playlists', function(request, response) {
    getPlaylists(request, response);
});

app.get('/playlist.css', function(request, response) {
    getStyle(request, response);
});

app.get('/reset.css', function(request, response) {
    getResetCSS(request, response);
});

app.get('/music-app.js', function(request, response) {
    getMusicAppJs(request, response);
});

app.get('/favicon.ico', function(request, response) {
    getFavicon(request, response);
});

app.get('/album_cover.jpg', function(request, response) {
    getAlbumCover(request, response);
});

app.get('/library', function(request, response) {
    getPlaylists(request, response);
});

app.get('/search', function(request, response) {
    getPlaylists(request, response);
});

app.get('/api/songs', function(request, response) {
    getSongsData(request, response);
});

app.get('/api/playlists', function(request, response) {
    getPlaylistsData(request, response);
});

app.post('/api/playlists', function(request, response) {
    addPlaylist(request, response);
});

app.post('/api/playlists/:id/', function(request, response) {
    addSong(request, response);
});

app.delete('/playlists/:id/', function(request, response) {
    removeSong(request, response);
});

app.get('/api/users/', function(request, response) {
    getUsersList(request, response);
});



// Create a server and provide it a callback to be executed for every HTTP request
// coming into localhost:3000.

models.sequelize.sync().then(function() {
    app.listen(3000, function() {
        console.log('Example app listening on port 3000! ');
        console.log('listening on *:3000');
    });
});
