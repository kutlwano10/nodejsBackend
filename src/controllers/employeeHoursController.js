// const db = require('../config/db')

// exports.logEmployeeHours = (req, res) => {
//     const { 
//       employee_id, 
//       project_id, 
//       hours_worked, 
//       work_date, 
//       description 
//     } = req.body;
  
//     // Validation
//     if (!employee_id || !project_id || !hours_worked || !work_date) {
//       return res.status(400).json({ 
//         error: 'Employee ID, Project ID, Hours Worked, and Work Date are required' 
//       });
//     }
  
//     // Validate hours worked
//     const hoursNum = parseFloat(hours_worked);
//     if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
//       return res.status(400).json({ 
//         error: 'Hours worked must be a number between 0 and 24' 
//       });
//     }
  
//     // Check if employee is assigned to the project
//     const checkAssignmentQuery = `
//       SELECT * FROM assign_employee 
//       WHERE employee_id = ? AND project_id = ?
//     `;
  
//     db.query(checkAssignmentQuery, [employee_id, project_id], (err, assignments) => {
//       if (err) {
//         return res.status(500).json({ error: 'Database error checking project assignment' });
//       }
  
//       if (assignments.length === 0) {
//         return res.status(403).json({ 
//           error: 'Employee is not assigned to this project' 
//         });
//       }
  
//       // Check for duplicate entry
//       const checkDuplicateQuery = `
//         SELECT * FROM employee_hours 
//         WHERE employee_id = ? 
//         AND project_id = ? 
//         AND work_date = ?
//       `;
  
//       db.query(checkDuplicateQuery, [employee_id, project_id, work_date], (err, existingEntries) => {
//         if (err) {
//           return res.status(500).json({ error: 'Database error checking existing entries' });
//         }
  
//         if (existingEntries.length > 0) {
//           return res.status(409).json({ 
//             error: 'Hours already logged for this date and project' 
//           });
//         }
  
//         // Insert hours log
//         const insertQuery = `
//           INSERT INTO employee_hours (
//             employee_id, 
//             project_id, 
//             hours_worked, 
//             work_date, 
//             description
//           ) VALUES (?, ?, ?, ?, ?)
//         `;
  
//         db.query(
//           insertQuery, 
//           [employee_id, project_id, hoursNum, work_date, description || null], 
//           (err, result) => {
//             if (err) {
//               return res.status(500).json({ error: 'Failed to log hours' });
//             }
  
//             res.status(201).json({
//               message: 'Hours logged successfully',
//               data: {
//                 id: result.insertId,
//                 employee_id,
//                 project_id,
//                 hours_worked: hoursNum,
//                 work_date,
//                 description
//               }
//             });
//           }
//         );
//       });
//     });
//   };
  
//   // Method to get projects for an employee
//   exports.getEmployeeProjects = (req, res) => {
//     const { employee_id } = req.query;
  
//     if (!employee_id) {
//       return res.status(400).json({ error: 'Employee ID is required' });
//     }
  
//     const query = `
//       SELECT p.id, p.name 
//       FROM projects p
//       JOIN assign_employee ae ON p.id = ae.project_id
//       WHERE ae.employee_id = ?
//     `;
  
//     db.query(query, [employee_id], (err, projects) => {
//       if (err) {
//         return res.status(500).json({ error: 'Failed to fetch projects' });
//       }
  
//       res.json({ projects });
//     });
//   };