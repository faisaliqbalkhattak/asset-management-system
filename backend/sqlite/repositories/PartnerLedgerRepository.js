// =====================================================
// PARTNER LEDGER REPOSITORY
// =====================================================
// Tracks partner share credits and payment debits
// =====================================================

const BaseRepository = require('./BaseRepository');
const { get, all } = require('../db');

class PartnerLedgerRepository extends BaseRepository {
    constructor() {
        super('partner_ledger');
    }

    getAll(orderBy = 'entry_date DESC, id DESC') {
        return all(`SELECT * FROM ${this.tableName} ORDER BY ${orderBy}`);
    }

    getByPartner(partnerId) {
        const sql = `SELECT * FROM ${this.tableName} WHERE partner_id = ? ORDER BY entry_date ASC, id ASC`;
        return all(sql, [partnerId]);
    }

    getBalances() {
        const sql = `
            SELECT partner_id,
                   COALESCE(SUM(CASE WHEN entry_type = 'SHARE' THEN amount ELSE 0 END), 0) AS total_share,
                   COALESCE(SUM(CASE WHEN entry_type = 'PAYMENT' THEN amount ELSE 0 END), 0) AS total_paid,
                   COALESCE(SUM(CASE WHEN entry_type = 'SHARE' THEN amount ELSE 0 END), 0) -
                   COALESCE(SUM(CASE WHEN entry_type = 'PAYMENT' THEN amount ELSE 0 END), 0) AS balance
            FROM ${this.tableName}
            GROUP BY partner_id
            ORDER BY partner_id
        `;
        return all(sql);
    }

    upsertShareEntry(partnerId, periodMonth, periodYear, amount) {
        const existing = get(
            `SELECT * FROM ${this.tableName} WHERE partner_id = ? AND period_month = ? AND period_year = ? AND entry_type = 'SHARE'`,
            [partnerId, periodMonth, periodYear]
        );
        const payload = {
            partner_id: partnerId,
            entry_date: new Date().toISOString().split('T')[0],
            period_month: periodMonth,
            period_year: periodYear,
            entry_type: 'SHARE',
            amount: parseFloat(amount) || 0,
            notes: 'Monthly share'
        };
        if (existing) {
            return this.update(existing.id, payload);
        }
        return this.create(payload);
    }
}

module.exports = PartnerLedgerRepository;
