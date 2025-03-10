const db = require("../config/db");

exports.createProject = async (req, res) => {
  const {
    name,
    description,
    location,
    start_date,
    end_date,
    budget,
    status,
    assignedEmployeeId,
  } = req.body;

  if (!name || !location || !start_date || !end_date || !budget || !status || !assignedEmployeeId) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const projectQuery = `
    INSERT INTO projects (name, description, location, start_date, end_date, budget, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const assignQuery = `
    INSERT INTO assign_employee (project_id, employee_id)
    VALUES (?, ?)
  `;

  try {
    // Insert project into the database
    const [projectResult] = await db.query(projectQuery, [
      name,
      description,
      location,
      start_date,
      end_date,
      budget,
      status,
    ]);

    const projectId = projectResult.insertId;

    // Assign employee to the project
    const [assignResult] = await db.query(assignQuery, [
      projectId,
      assignedEmployeeId,
    ]);

    res.status(201).json({
      message: "Project created and employee assigned successfully",
      projectId: projectId,
      assignmentId: assignResult.insertId,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};


exports.getEmployeesByProjectId = async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  const query = `
    SELECT u.id, u.name, u.email
    FROM assign_employee ae
    JOIN users u ON ae.employee_id = u.id
    WHERE ae.project_id = ?
  `;

  try {
    const [employees] = await db.query(query, [projectId]);

    res.status(200).json({ employees });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch assigned employees" });
  }
};


/** Assign employee to a Project */
exports.assignEmployeeToProject = async (req, res) => {
  const { projectId, employeeId } = req.body;

  // Validate input
  if (!projectId || !employeeId) {
    return res.status(400).json({ error: "Project ID and Employee ID are required" });
  }

  const checkQuery = `
    SELECT 
      (SELECT COUNT(*) FROM projects WHERE id = ?) AS projectExists,
      (SELECT COUNT(*) FROM users WHERE id = ?) AS employeeExists
  `;

  const duplicateCheckQuery = `
    SELECT COUNT(*) AS count 
    FROM assign_employee 
    WHERE project_id = ? AND employee_id = ?
  `;

  const assignQuery = `
    INSERT INTO assign_employee (project_id, employee_id)
    VALUES (?, ?)
  `;

  try {
    // Check if project and employee exist
    const [[checkResult]] = await db.query(checkQuery, [projectId, employeeId]);

    if (!checkResult.projectExists) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (!checkResult.employeeExists) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Check if employee is already assigned to the project
    const [[dupResult]] = await db.query(duplicateCheckQuery, [
      projectId,
      employeeId,
    ]);

    if (dupResult.count > 0) {
      return res.status(400).json({
        error: "Employee is already assigned to this project",
      });
    }

    // Assign employee to project
    const [assignResult] = await db.query(assignQuery, [projectId, employeeId]);

    res.status(201).json({
      message: "Employee assigned to project successfully",
      assignmentId: assignResult.insertId,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};


/**
 * @param {*} req - 
 * @param {*} res - returns all the Projects
 */
exports.getProjects = async (req, res) => {
  try {
    // Extract query parameters
    const { limit = 10, offset = 0, status, search } = req.query;

    // Base SQL query
    let sql = "SELECT * FROM projects";
    const params = [];

    // Add filtering by status (if provided)
    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }

    // Add search by project name or description (if provided)
    if (search) {
      sql += status ? " AND" : " WHERE";
      sql += " (name LIKE ? OR description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add pagination (limit and offset)
    sql += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    // Execute the query
    const [results] = await db.query(sql, params);

    // Send the response
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};


exports.getProjectById = async (req, res) => {
  const projectId = req.params.id; // Assuming the ID is passed as a URL parameter

  console.log("requested", projectId)
  if (!projectId) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  try {
    const [results] = await db.query("SELECT * FROM projects WHERE id = ?", [projectId]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.status(200).json({ success: true, data: results[0] });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};

/**
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
exports.logEmployeeHours = async (req, res) => {
  console.log("requested body :", req.body);
  const { employee_id, project_id, hours_worked, work_date, description } = req.body;

  // Validation
  if (!employee_id || !project_id || !hours_worked || !work_date) {
    return res.status(400).json({ error: "Employee ID, Project ID, Hours Worked, and Work Date are required" });
  }

  // Validate hours worked
  const hoursNum = parseFloat(hours_worked);
  if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
    return res.status(400).json({ error: "Hours worked must be a number between 0 and 24" });
  }

  // Validate work_date format (optional)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
  if (!dateRegex.test(work_date)) {
    return res.status(400).json({ error: "Work date must be in the format YYYY-MM-DD" });
  }

  try {
    // Check existence of employee and project
    const [[existenceResults]] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE id = ?) as user_exists,
        (SELECT COUNT(*) FROM projects WHERE id = ?) as project_exists
    `, [employee_id, project_id]);

    // Check if employee and project exist
    if (existenceResults.user_exists === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (existenceResults.project_exists === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if employee is assigned to the project
    const [assignments] = await db.query(`
      SELECT * FROM assign_employee 
      WHERE employee_id = ? AND project_id = ?
    `, [employee_id, project_id]);

    if (assignments.length === 0) {
      return res.status(403).json({ error: "Employee is not assigned to this project" });
    }

    // Check for duplicate entry
    const [existingEntries] = await db.query(`
      SELECT * FROM employee_hours 
      WHERE employee_id = ? 
      AND project_id = ? 
      AND work_date = ?
    `, [employee_id, project_id, work_date]);

    if (existingEntries.length > 0) {
      return res.status(409).json({ error: "Hours already logged for this date and project" });
    }

    // Insert hours log
    const [result] = await db.query(`
      INSERT INTO employee_hours (
        employee_id, 
        project_id, 
        hours_worked, 
        work_date, 
        description
      ) VALUES (?, ?, ?, ?, ?)
    `, [employee_id, project_id, hoursNum, work_date, description || null]);

    res.status(201).json({
      message: "Hours logged successfully",
      data: {
        id: result.insertId,
        employee_id,
        project_id,
        hours_worked: hoursNum,
        work_date,
        description,
      },
    });
  } catch (error) {
    console.error("Failed to log hours:", error);
    res.status(500).json({ error: "Failed to log hours" });
  }
};

/**
 * Get all hours worked by an employee on a specific project
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
exports.getEmployeeProjectHours = async (req, res) => {
  const { employee_id, project_id } = req.params;

  // Validation
  if (!employee_id || !project_id) {
    return res.status(400).json({ error: "Employee ID and Project ID are required" });
  }

  try {
    // Check existence of employee and project
    const [[existenceResults]] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE id = ?) as user_exists,
        (SELECT COUNT(*) FROM projects WHERE id = ?) as project_exists
    `, [employee_id, project_id]);

    // Check if employee and project exist
    if (existenceResults.user_exists === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (existenceResults.project_exists === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if employee is assigned to the project
    const [assignments] = await db.query(`
      SELECT * FROM assign_employee 
      WHERE employee_id = ? AND project_id = ?
    `, [employee_id, project_id]);

    if (assignments.length === 0) {
      return res.status(403).json({ error: "Employee is not assigned to this project" });
    }

    // Fetch all hours logged for the employee on the project
    const [hours] = await db.query(`
      SELECT * FROM employee_hours 
      WHERE employee_id = ? 
      AND project_id = ?
      ORDER BY work_date ASC
    `, [employee_id, project_id]);

    res.status(200).json({
      success: true,
      data: hours,
    });
  } catch (error) {
    console.error("Failed to fetch employee project hours:", error);
    res.status(500).json({ error: "Failed to fetch employee project hours" });
  }
};

// Method to get projects for an employee
exports.getEmployeeProjects = async (req, res) => {
  const { employee_id } = req.params;

  if (!employee_id) {
    return res.status(400).json({ error: "Employee ID is required" });
  }

  try {
    // Verify employee exists first
    const [userResults] = await db.query("SELECT * FROM users WHERE id = ?", [employee_id]);

    if (userResults.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Fetch projects
    const [projects] = await db.query(`
      SELECT p.id, p.name, p.description, p.location, p.start_date, p.end_date, p.budget, p.status
      FROM projects p
      JOIN assign_employee ae ON p.id = ae.project_id
      WHERE ae.employee_id = ?
    `, [employee_id]);

    res.json({ projects });
  } catch (error) {
    console.error("Database error fetching employee projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};
