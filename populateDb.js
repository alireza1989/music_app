////////////////////////////////////////////////
//       This file is used to create DB
////////////////////////////////////////////////


var fs = require('fs');
var models = require('./models');
const bcrypt = require('bcrypt');

models.sequelize.sync({
    force: true
}).then(function() {

    fs.readFile('./songs.json', function(err, data) {
        var music_data = JSON.parse(data);
        var songs = music_data['songs'];

        songs.forEach(function(song) {
            models.Song.create({
                title: song.title,
                album: song.album,
                artist: song.artist,
                duration: song.duration,
            });

        });
    });


    fs.readFile('./playlists.json', function(err, data) {
        var playlist_data = JSON.parse(data);
        var playlists = playlist_data['playlists'];

        playlists.forEach(function(playlist) {
            models.Playlist.create({
                    name: playlist.name,
                })
                .then(function(playlistInstance) {
                    playlistInstance.setSongs(playlist.songs);
                });
        });

    });

    fs.readFile('./users.json', function(err, data) {
        var users_data = JSON.parse(data);
        var users = users_data['users'];

        users.forEach(function(user) {

            bcrypt.hash(user.password, 10, function(err, hash) {
                models.User.create({
                        username: user.username,
                        password: hash,
                    })
                    .then(function(userInstance) {
                        userInstance.setPlaylists(user.playlists);
                    });
            });
        });

    });

});
