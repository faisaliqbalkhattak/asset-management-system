// =====================================================
// HUMAN RESOURCE REPOSITORY
// =====================================================
// Employee master data - maps to 'human_resources' table
// =====================================================

const BaseRepository = require('./BaseRepository');

class HumanResourceRepository extends BaseRepository {
    constructor() {
        super('human_resources');
    }

    /**
     * Create employee
     */
    create(data) {
        const insertData = {
            employee_name: data.employee_name || data.name,
            designation: data.designation,
            department: data.department || 'PLANT',
            base_salary: data.base_salary || data.base_salary_month || 0,
            phone: data.phone || '',
            address: data.address || '',
            joining_date: data.joining_date || null,
            status: data.status || 'active',
            is_active: data.status === 'inactive' ? 0 : 1,
        };
        
        // Remove undefined values
        Object.keys(insertData).forEach(key => {
            if (insertData[key] === undefined) delete insertData[key];
        });
        
        return this.insert(insertData);
    }

    /**
     * Update employee
     */
    updateById(id, data) {
        const updateData = {};
        if (data.employee_name !== undefined) updateData.employee_name = data.employee_name;
        if (data.name !== undefined) updateData.employee_name = data.name;
        if (data.designation !== undefined) updateData.designation = data.designation;
        if (data.department !== undefined) updateData.department = data.department;
        if (data.base_salary !== undefined) updateData.base_salary = data.base_salary;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.joining_date !== undefined) updateData.joining_date = data.joining_date;
        if (data.status !== undefined) {
            updateData.status = data.status;
            updateData.is_active = data.status === 'active' ? 1 : 0;
        }
        if (data.is_active !== undefined) updateData.is_active = data.is_active;
        
        return super.updateById(id, updateData);
    }

    /**
     * Get all active employees
     */
    getActive() {
        return super.findAll({ is_active: 1 });
    }

    /**
     * Get employee by name
     */
    getByName(name) {
        return super.findOne({ employee_name: name });
    }
}

module.exports = HumanResourceRepository;
