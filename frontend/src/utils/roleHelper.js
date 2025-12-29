/**
 * Checks if the user has a specific role in a specific department.
 * @param {Array} permissions - Array of { RoleCode, DepartmentCode }
 * @param {String} departmentCode - e.g., 'FAC', 'SAF'
 * @param {String} roleCode - e.g., 'ADM', 'PLN', 'TEC', 'USR'
 * @returns {Boolean}
 */
export const hasRole = (permissions, departmentCode, roleCode) => {
    if (!permissions || !Array.isArray(permissions)) return false;
    
    return permissions.some(p => 
        p.DepartmentCode === departmentCode && p.RoleCode === roleCode
    );
};