// const db = require('../config/db'); // Adjust the path to your database connection

// const verifyProjectAssignment = (req, res, next) => {
//     const { employee_id, project_id, employee_name, project_name } = req.body;

//     if (employee_id && project_id) {
//         // Use provided IDs
//         req.employee_id = employee_id;
//         req.project_id = project_id;
//         next();
//     } else if (employee_name && project_name) {
//         // Fetch IDs from database
//         const query = `
//           SELECT employee_id, project_id 
//           FROM assign_employee 
//           WHERE employee_name = ? 
//           AND project_name = ?
//         `;

//         db.query(query, [employee_name, project_name], (err, results) => {
//             if (err) {
//                 console.error('Database error:', err);
//                 return res.status(500).json({ 
//                     error: 'Error fetching employee and project details' 
//                 });
//             }
            
//             if (results.length === 0) {
//                 return res.status(403).json({ 
//                     error: 'Employee is not assigned to this project' 
//                 });
//             }
           
//             req.employee_id = results[0].employee_id;
//             req.project_id = results[0].project_id;
//             next();
//         });
//     } else {
//         console.log(employee_id)
//         console.log(project_id)
//         console.log(employee_name)
//         console.log(project_name)
//         return res.status(400).json({ 
//             error: 'Either employee_id and project_id or employee_name and project_name are required' 
//         });
//     }
// };

// module.exports = verifyProjectAssignment