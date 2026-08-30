const {PrismaClient} = require('@prisma/client');
const { default: prismaConfig } = require('../prisma.config');

try {
    require('@prisma/client');

}catch (e) {
    console.error('Prisma client not generated . Run:');
    console.error('npx prisma generated');
    console.exit(1);
}

const prisma = new prismaConfig({
    log:['query','info','warn','error']
});

prisma.$connect()   
    .then(()=> console.log('prisma connected successfully'))
    .catch(err =>{
        console.error('prisma connection failed',err);
        process.exit(1);
    })