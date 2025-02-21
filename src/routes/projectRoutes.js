const express = require('express');
const projectController = require('../controllers/projectController');

const router = express.Router();

router.post('/assign', projectController.assignEmployeeToProject)
router.post('/create', projectController.createProject);
router.post('/log-hours', projectController.logEmployeeHours)

router.get('/:projectId/employees', projectController.getEmployeesByProjectId)
router.get('/all', projectController.getProjects);
router.get('/:employee_id/my-projects', projectController.getEmployeeProjects)
router.get('/my-logged-hours', projectController.getEmployeeHours)
router.get('/:id', projectController.getProjectById)



module.exports = router;