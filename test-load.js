try {
    require('./app');
    console.log('SUCCESS: App loaded');
} catch (error) {
    console.error('ERROR:', error.message);
    console.error('STACK:', error.stack);
    process.exit(1);
}
