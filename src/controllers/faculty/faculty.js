import { getFacultyBySlug, getSortedFaculty } from '../../models/faculty/faculty.js';

// Route handler for the faculty directory list page
const facultyListPage = async (req, res) => {
    const sortBy = req.query.sort || 'name';
    const facultyMembers = await getSortedFaculty(sortBy);

    res.render('faculty/list', {
        title: 'Faculty Directory',
        facultyMembers,
        currentSort: ['name', 'department', 'title'].includes(sortBy) ? sortBy : 'name'
    });
};

// Route handler for individual faculty profile pages
const facultyDetailPage = async (req, res, next) => {
    const facultySlug = req.params.facultyId;
    const facultyMember = await getFacultyBySlug(facultySlug);

    // If faculty member not found, forward a 404 error
    if (Object.keys(facultyMember).length === 0) {
        const err = new Error(`Faculty member ${facultySlug} not found`);
        err.status = 404;
        return next(err);
    }

    res.render('faculty/detail', {
        title: `${facultyMember.name} - Faculty Profile`,
        facultyMember
    });
};

export { facultyListPage, facultyDetailPage };
