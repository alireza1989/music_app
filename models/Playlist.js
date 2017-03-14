module.exports = function(sequelize, DataType) {
    var Playlist = sequelize.define('Playlist', {
        name: {
            type: DataType.STRING,
            field: 'name'
        }
    }, {
        timestamps: false,
        classMethods: {
            associate: function(models) {
                Playlist.belongsToMany(models.Song, {
                    through: 'Songs_Playlists',
                    foreignKey: 'playlist_id',
                    timestamps: false
                })
            }
        }
    }, {
        timestamps: false,
        classMethods: {
            associate: function(models) {
                Playlist.belongsToMany(models.User, {
                    through: 'Users_Playlists',
                    foreignKey: 'playlist_id',
                    timestamps: false
                })
            }
        }
    });
    return Playlist;
};
