// Route handlers for static pages
let demoPageRequestCount = 0;

const homePage = (req, res) => {
    res.render('home', { title: 'Home' });
};

const aboutPage = (req, res) => {
    res.render('about', { title: 'About' });
};

const demoPage = (req, res) => {
    demoPageRequestCount += 1;
    res.render('demo', {
        title: 'Middleware Demo Page',
        demoRequestCount: demoPageRequestCount
    });
};

const testErrorPage = (req, res, next) => {
    const err = new Error('This is a test error');
    err.status = 500;
    next(err);
};

export { homePage, aboutPage, demoPage, testErrorPage };
