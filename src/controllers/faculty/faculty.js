import { getFacultyById, getSortedFaculty } from '../../models/faculty/faculty.js';

// Route handler for the faculty directory list page
const facultyListPage = (req, res) => {
    const sortBy = req.query.sort || 'name';
    const facultyMembers = getSortedFaculty(sortBy);

    res.render('faculty/list', {
        title: 'Faculty Directory',
        facultyMembers,
        currentSort: ['name', 'department', 'title'].includes(sortBy) ? sortBy : 'name'
    });
};

// Route handler for individual faculty profile pages
const facultyDetailPage = (req, res, next) => {
    const facultyId = req.params.facultyId;
    const facultyMember = getFacultyById(facultyId);

    // If faculty member not found, forward a 404 error
    if (!facultyMember) {
        const err = new Error(`Faculty member ${facultyId} not found`);
        err.status = 404;
        return next(err);
    }

    res.render('faculty/detail', {
        title: `${facultyMember.name} - Faculty Profile`,
        facultyMember
    });
};

export { facultyListPage, facultyDetailPage };
