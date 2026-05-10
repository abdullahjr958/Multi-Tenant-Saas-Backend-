import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const { default: app } = await import('./app');
    
    console.log('DB URL:', process.env.DATABASE_URL);
    
    app.listen(process.env.PORT || 3000, () => {
        console.log('Server is running on Port 3000');
    });
}

main();