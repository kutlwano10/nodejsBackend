const db = require('../config/db');

exports.createProject = (req, res) => {
  const { name, description, location, start_date, end_date, budget, status, assignedEmployeeId } = req.body;

  if (!name || !location || !start_date || !end_date || !budget || !status || !assignedEmployeeId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const projectQuery = `
    INSERT INTO projects (name, description, location, start_date, end_date, budget, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    projectQuery,
    [name, description, location, start_date, end_date, budget, status],
    (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to create project' });
      }

      const projectId = result.insertId;

      // Now assign the employee to the project
      const assignQuery = `
        INSERT INTO assign_employee (project_id, employee_id)
        VALUES (?, ?)
      `;

      db.query(assignQuery, [projectId, assignedEmployeeId], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to assign employee to project' });
        }

        res.status(201).json({
          message: 'Project created and employee assigned successfully',
          projectId: projectId,
          assignmentId: result.insertId
        });
      });
    }
  );
};

exports.getEmployeesByProjectId = (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  const query = `
    SELECT u.id, u.name, u.email
    FROM assign_employee ae
    JOIN users u ON ae.employee_id = u.id
    WHERE ae.project_id = ?
  `;

  db.query(query, [projectId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch assigned employees' });
    }

    res.status(200).json({ employees: results });
  });
};

/** Assign employee to a Project */
exports.assignEmployeeToProject = (req, res) => {
  const { projectId, employeeId } = req.body;

  // Validate input
  if (!projectId || !employeeId) {
    return res.status(400).json({ error: 'Project ID and Employee ID are required' });
  }

  // First check if the project and employee exist
  const checkQuery = `
    SELECT 
      (SELECT COUNT(*) FROM projects WHERE id = ?) as projectExists,
      (SELECT COUNT(*) FROM users WHERE id = ?) as employeeExists
  `;

  db.query(checkQuery, [projectId, employeeId], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('Database error:', checkErr);
      return res.status(500).json({ error: 'Error checking project and employee existence' });
    }

    const { projectExists, employeeExists } = checkResult[0];

    if (!projectExists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!employeeExists) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if assignment already exists
    const duplicateCheck = `
      SELECT COUNT(*) as count 
      FROM assign_employee 
      WHERE project_id = ? AND employee_id = ?
    `;

    db.query(duplicateCheck, [projectId, employeeId], (dupErr, dupResult) => {
      if (dupErr) {
        console.error('Database error:', dupErr);
        return res.status(500).json({ error: 'Error checking existing assignment' });
      }

      if (dupResult[0].count > 0) {
        return res.status(400).json({ error: 'Employee is already assigned to this project' });
      }

      // If all checks pass, create the assignment
      const assignQuery = `
        INSERT INTO assign_employee (project_id, employee_id)
        VALUES (?, ?)
      `;

      db.query(assignQuery, [projectId, employeeId], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to assign employee to project' });
        }

        res.status(201).json({
          message: 'Employee assigned to project successfully',
          assignmentId: result.insertId
        });
      });
    });
  });
};

/**
 * 
 * @param {*} req - 
 * @param {*} res -returns all the Projects
 */
exports.getProjects = (req, res) => {
  db.query('SELECT * FROM projects', (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }
    res.status(200).json({ success: true, data: results });
  });
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
exports.logEmployeeHours = (req, res) => {

  console.log("requested body :", req.body)
  const { 
    employee_id, 
    project_id, 
    hours_worked, 
    work_date, 
    description 
  } = req.body;

  // Validation
  if (!employee_id || !project_id || !hours_worked || !work_date) {
    return res.status(400).json({ 
      error: 'Employee ID, Project ID, Hours Worked, and Work Date are required' 
    });
  }

  // Validate hours worked
  const hoursNum = parseFloat(hours_worked);
  if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
    return res.status(400).json({ 
      error: 'Hours worked must be a number between 0 and 24' 
    });
  }

  // Validate work_date format (optional)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
  if (!dateRegex.test(work_date)) {
    return res.status(400).json({ 
      error: 'Work date must be in the format YYYY-MM-DD' 
    });
  }

  // First, validate that both employee and project exist
  const checkExistenceQuery = `
    SELECT 
      (SELECT COUNT(*) FROM users WHERE id = ?) as user_exists,
      (SELECT COUNT(*) FROM projects WHERE id = ?) as project_exists
  `;

  db.query(checkExistenceQuery, [employee_id, project_id], (err, existenceResults) => {
    if (err) {
      console.error('Database error checking existence:', err);
      return res.status(500).json({ error: 'Database error checking existence' });
    }

    // Check if employee and project exist
    if (existenceResults[0].user_exists === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (existenceResults[0].project_exists === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if employee is assigned to the project
    const checkAssignmentQuery = `
      SELECT * FROM assign_employee 
      WHERE employee_id = ? AND project_id = ?
    `;

    db.query(checkAssignmentQuery, [employee_id, project_id], (err, assignments) => {
      if (err) {
        console.error('Database error checking project assignment:', err);
        return res.status(500).json({ error: 'Database error checking project assignment' });
      }

      if (assignments.length === 0) {
        return res.status(403).json({ 
          error: 'Employee is not assigned to this project' 
        });
      }

      // Check for duplicate entry
      const checkDuplicateQuery = `
        SELECT * FROM employee_hours 
        WHERE employee_id = ? 
        AND project_id = ? 
        AND work_date = ?
      `;

      db.query(checkDuplicateQuery, [employee_id, project_id, work_date], (err, existingEntries) => {
        if (err) {
          console.error('Database error checking existing entries:', err);
          return res.status(500).json({ error: 'Database error checking existing entries' });
        }

        if (existingEntries.length > 0) {
          return res.status(409).json({ 
            error: 'Hours already logged for this date and project' 
          });
        }

        // Insert hours log
        const insertQuery = `
          INSERT INTO employee_hours (
            employee_id, 
            project_id, 
            hours_worked, 
            work_date, 
            description
          ) VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
          insertQuery, 
          [employee_id, project_id, hoursNum, work_date, description || null], 
          (err, result) => {
            if (err) {
              console.error('Failed to log hours:', err);
              return res.status(500).json({ error: 'Failed to log hours' });
            }

            res.status(201).json({
              message: 'Hours logged successfully',
              data: {
                id: result.insertId,
                employee_id,
                project_id,
                hours_worked: hoursNum,
                work_date,
                description
              }
            });
          }
        );
      });
    });
  });
};



exports.getEmployeeHours = (req, res) => {
  const { employee_id, project_id, start_date, end_date } = req.query;

  // Validate required fields
  if (!employee_id || !project_id) {
    return res.status(400).json({ 
      error: 'Employee ID and Project ID are required' 
    });
  }

  // Optional date range validation
  if (start_date && !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
    return res.status(400).json({ 
      error: 'Start date must be in the format YYYY-MM-DD' 
    });
  }

  if (end_date && !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
    return res.status(400).json({ 
      error: 'End date must be in the format YYYY-MM-DD' 
    });
  }

  // Construct the query
  let query = `
    SELECT * FROM employee_hours 
    WHERE employee_id = ? 
    AND project_id = ?
  `;
  const queryParams = [employee_id, project_id];

  // Add date range filter if provided
  if (start_date && end_date) {
    query += ' AND work_date BETWEEN ? AND ?';
    queryParams.push(start_date, end_date);
  } else if (start_date) {
    query += ' AND work_date >= ?';
    queryParams.push(start_date);
  } else if (end_date) {
    query += ' AND work_date <= ?';
    queryParams.push(end_date);
  }

  // Execute the query
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Database error fetching employee hours:', err);
      return res.status(500).json({ error: 'Database error fetching employee hours' });
    }

    res.status(200).json({
      message: 'Employee hours fetched successfully',
      data: results
    });
  });
};

// Method to get projects for an employee
exports.getEmployeeProjects = (req, res) => {
  const { employee_id } = req.params;

  if (!employee_id) {
    return res.status(400).json({ error: 'Employee ID is required' });
  }

  // Verify employee exists first
  const checkUserQuery = 'SELECT * FROM users WHERE id = ?';
  
  db.query(checkUserQuery, [employee_id], (userErr, userResults) => {
    if (userErr) {
      return res.status(500).json({ error: 'Database error checking user' });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Fetch projects
    const query = `
      SELECT p.id, p.name 
      FROM projects p
      JOIN assign_employee ae ON p.id = ae.project_id
      WHERE ae.employee_id = ?
    `;

    db.query(query, [employee_id], (err, projects) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }
      
      res.json({ projects });
    });
  });
};