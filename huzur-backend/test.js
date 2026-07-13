const client = require("./services/qdrant");

async function test() {
    try {

        const collections = await client.getCollections();

        console.log(collections);

    } catch(err){

        console.log(err);

    }
}

test();
