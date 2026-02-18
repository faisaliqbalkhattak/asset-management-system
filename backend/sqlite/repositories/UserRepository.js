const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
    constructor() {
        super('user');
    }
}

module.exports = UserRepository;
