// MaterialRepository.js
const BaseRepository = require('./BaseRepository');

class MaterialRepository extends BaseRepository {
    constructor() {
        super('material');
    }

    findByCode(material_code) {
        return this.db.prepare('SELECT * FROM material WHERE material_code = ?').get(material_code);
    }

    findByType(material_type) {
        return this.db.prepare('SELECT * FROM material WHERE material_type = ?').all(material_type);
    }

    findActive() {
        return this.db.prepare('SELECT * FROM material WHERE is_active = 1 ORDER BY material_name').all();
    }
}

module.exports = new MaterialRepository();
