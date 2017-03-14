module.exports = function(sequelize, DataType) {
    var User = sequelize.define('User', {
        username: {
            type: DataType.STRING,
            field: 'username'
        },
        password: {
            type: DataType.STRING,
            field: 'password'
        }
    }, {
        timestamps: false,
        classMethods: {
            associate: function(models) {
                User.belongsToMany(models.Playlist, {
                    through: 'Users_Playlists',
                    foreignKey: 'user_id',
                    timestamps: false
                })
            }
        }
    });
    return User;
};
