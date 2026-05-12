// Import express using ESM syntax
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

// Define the port number the server will listen on
const NODE_ENV = process.env.NODE_ENV || 'production';
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// When in development mode, start a WebSocket server for live reloading
if (NODE_ENV.includes('dev')) {
    const ws = await import('ws');

    try {
        const wsPort = parseInt(PORT) + 1;
        const wsServer = new ws.WebSocketServer({ port: wsPort });

        wsServer.on('listening', () => {
            console.log(`WebSocket server is running on port ${wsPort}`);
        });

        wsServer.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    } catch (error) {
        console.error('Failed to start WebSocket server:', error);
    }
}

// Create an instance of an Express application
const app = express();

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Tell Express where to find your templates
app.set('views', path.join(__dirname, 'src/views'));
app.use(express.static(path.join(__dirname, 'public')));

// Logger for detailed error information
const errorLogger = (err, req) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.get('user-agent') || 'Unknown';
    const ip = req.ip;
    const status = err.status || 500;
    const message = err.message || 'Unknown error';
    const stack = err.stack;

    const logEntry = {
        timestamp,
        status,
        method,
        url,
        ip,
        userAgent,
        message,
        stack: NODE_ENV.includes('dev') ? stack : undefined
    };

    console.error('\n' + '='.repeat(70));
    console.error(`[ERROR LOG] ${timestamp}`);
    console.error(`Status: ${status} | Method: ${method} | URL: ${url}`);
    console.error(`IP: ${ip}`);
    console.error(`User Agent: ${userAgent}`);
    console.error(`Message: ${message}`);
    if (NODE_ENV.includes('dev')) {
        console.error(`\nStack Trace:\n${stack}`);
    }
    console.error('='.repeat(70) + '\n');

    return logEntry;
};

app.use((req, res, next) => {
    // Make NODE_ENV available to all templates
    res.locals.NODE_ENV = NODE_ENV.toLowerCase() || 'production';
    // Continue to the next middleware or route handler
    next();
});

app.get('/', (req, res) => {
    const title = 'Welcome Home';
    res.render('home', { title });
});
app.get('/about', (req, res) => {
    const title = 'About Me';
    res.render('about', { title });
});
app.get('/products', (req, res) => {
    const title = 'Our Products';
    res.render('products', { title });
});

// ============================================================
// TEST ROUTES - Different Error Scenarios
// ============================================================

// Test route for 404 errors
app.get('/test-404', (req, res, next) => {
    const err = new Error('This is a test 404 error - Resource not found');
    err.status = 404;
    next(err);
});

// Test route for 500 errors
app.get('/test-500', (req, res, next) => {
    const err = new Error('This is a test 500 error - Internal server error');
    err.status = 500;
    next(err);
});

// Test route for 400 Bad Request
app.get('/test-400', (req, res, next) => {
    const err = new Error('This is a test 400 error - Bad request');
    err.status = 400;
    next(err);
});

// Test route for 403 Forbidden
app.get('/test-403', (req, res, next) => {
    const err = new Error('This is a test 403 error - Access forbidden');
    err.status = 403;
    next(err);
});

// Test route for 503 Service Unavailable
app.get('/test-503', (req, res, next) => {
    const err = new Error('This is a test 503 error - Service temporarily unavailable');
    err.status = 503;
    next(err);
});

// Test route for unhandled exception
app.get('/test-exception', (req, res, next) => {
    // This will throw an unhandled error
    throw new Error('This is an unhandled exception test');
});

// Test route that simulates a database error
app.get('/test-db-error', (req, res, next) => {
    const err = new Error('Database connection failed - Unable to reach the database server');
    err.status = 500;
    next(err);
});

// Test route for timeout
app.get('/test-timeout', (req, res, next) => {
    const err = new Error('Request timeout - The server took too long to respond');
    err.status = 504;
    next(err);
});

// Catch-all route for 404 errors
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Global error handler
app.use((err, req, res, next) => {
    // Log error details with enhanced information
    errorLogger(err, req);

    // Prevent infinite loops, if a response has already been sent, do nothing
    if (res.headersSent || res.finished) {
        return next(err);
    }

    // Determine status and template
    const status = err.status || 500;
    
    // Use 404 template for 404 errors, 5xx template for other errors
    let template = status === 404 ? '404' : '500';
    
    // Get error title based on status code
    const getErrorTitle = (code) => {
        const titles = {
            400: 'Bad Request',
            403: 'Forbidden',
            404: 'Page Not Found',
            500: 'Internal Server Error',
            503: 'Service Unavailable',
            504: 'Gateway Timeout'
        };
        return titles[code] || 'An Error Occurred';
    };

    // Prepare data for the template
    const context = {
        title: getErrorTitle(status),
        status: status,
        error: NODE_ENV === 'production' ? 'An error occurred' : err.message,
        stack: NODE_ENV === 'production' ? null : err.stack,
        NODE_ENV, // Our WebSocket check needs this and its convenient to pass along
        timestamp: new Date().toLocaleString(),
        url: req.originalUrl
    };

    // Render the appropriate error template with fallback
    try {
        res.status(status).render(`errors/${template}`, context);
    } catch (renderErr) {
        // If rendering fails, send a simple error page instead
        if (!res.headersSent) {
            res.status(status).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Error ${status}</title>
                    <style>
                        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                        .error-container { max-width: 600px; margin: 50px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        h1 { color: #d32f2f; }
                        p { color: #666; line-height: 1.6; }
                        a { color: #1976d2; text-decoration: none; }
                        a:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <h1>Error ${status}</h1>
                        <p>An error occurred while processing your request.</p>
                        <p><a href="/">Return to Homepage</a></p>
                    </div>
                </body>
                </html>
            `);
        }
    }
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server is running on http://127.0.0.1:${PORT}`);
});