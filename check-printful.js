const apiKey = process.env.PRINTFUL_API_KEY;
if (!apiKey) throw new Error("Missing PRINTFUL_API_KEY");

async function main() {
    // 336 is just a random printful product ID placeholder
    // Let's get his products from his printful store
    const res = await fetch("https://api.printful.com/store/products?limit=10", {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    const data = await res.json();
    console.log("Products:", Array.isArray(data.result) ? data.result.slice(0, 2).map(r => r.id + " " + r.name) : data);

    if (data.result && data.result.length > 0) {
        const pId = data.result[0].id;
        const pRes = await fetch(`https://api.printful.com/store/products/${pId}`, {
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        const pData = await pRes.json();

        console.log(`\nFiles for first variant of product ${pId}:`);
        if (pData.result.sync_variants && pData.result.sync_variants.length > 0) {
            console.log(JSON.stringify(pData.result.sync_variants[0].files, null, 2));
        }

        // Find a variant that has files.
        for (const v of pData.result.sync_variants) {
            console.dir(v.files, { depth: null });
            break;
        }
    }
}
main();
