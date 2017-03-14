module.exports = function(sequelize, DataType) {
    var Song = sequelize.define('Song', {
        album: {
            type: DataType.STRING,
            field: 'album'
        },
        title: {
            type: DataType.STRING,
            field: 'title'
        },
        artist: {
            type: DataType.STRING,
            field: 'artist'
        },
        duration: {
            type: DataType.INTEGER,
            field: 'duration'
        }
    }, {
    timestamps: false,
    classMethods: {
        associate: function(models) {
            Song.belongsToMany(models.Playlist, {
                through: 'Songs_Playlists',
                foreignKey: 'song_id',
                timestamps: false
            })
        }
    }
});

    return Song;
};
