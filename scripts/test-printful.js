require('dotenv').config({ path: '.env' })
const fetch = require('node-fetch');
async function test() {
    const API_KEY = process.env.PRINTFUL_API_KEY;
    const res = await fetch("https://api.printful.com/store/products", {
        headers: { "Authorization": `Bearer ${API_KEY}` }
    });
    const data = await res.json();
    if(data.result && data.result.length > 0) {
        const detailRes = await fetch(`https://api.printful.com/store/products/${data.result[0].id}`, {
            headers: { "Authorization": `Bearer ${API_KEY}` }
        });
        const detailData = await detailRes.json();
        console.log(JSON.stringify(detailData.result, null, 2));
    } else {
        console.log("No products found", data);
    }
}
test();
