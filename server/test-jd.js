const axios = require('axios');

async function testJD() {
    const sku = '10097619369640'; // User provided JD sku
    try {
        const url = `https://item.m.jd.com/product/${sku}.html`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
            },
            timeout: 5000
        });
        
        let pcRes;
        // Match JSON
        const match = data.match(/window\._itemInfo\s*=\s*(\{[\s\S]*?\});/);
        if (match) {
            const itemInfo = JSON.parse(match[1]);
            console.log('Title:', itemInfo.sku?.name);
            console.log('Image:', itemInfo.sku?.image?.[0]);
            console.log('Price:', itemInfo.price?.p);
        } else {
            console.log('Not found _itemInfo');
            // Try PC page parsing
            const pcUrl = `https://item.jd.com/${sku}.html`;
            pcRes = await axios.get(pcUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
                },
                timeout: 5000
            });
            const titleMatch = pcRes.data.match(/<title>([^<]+)<\/title>/);
            console.log('PC Title:', titleMatch ? titleMatch[1] : 'Not found');
            
            const imgMatch = pcRes.data.match(/<img[^>]+id="spec-img"[^>]+data-origin="([^"]+)"/);
            console.log('PC Image:', imgMatch ? imgMatch[1] : 'Not found');
        }
        
        // Try getting price separately just in case
        try {
            const priceRes = await axios.get(`https://p.3.cn/prices/mgets?skuIds=J_${sku}`, { 
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
                },
                timeout: 3000 
            });
            console.log('Public API Price Response:', priceRes.data);
            if (priceRes.data && priceRes.data[0] && priceRes.data[0].p) {
                console.log('Public API Price:', priceRes.data[0].p);
            }
        } catch(e) {
            console.log('Public API Price failed', e.message);
        }
        
        // try finding price in PC HTML
        if (pcRes) {
            const priceMatch = pcRes.data.match(/<em>￥<\/em><span class="price J-p-[^"]+">([^<]*)<\/span>/) || 
                              pcRes.data.match(/<span class="price J-p-[^"]+">([^<]*)<\/span>/) ||
                              pcRes.data.match(/"p":\s*"([^"]+)"/) ||
                              pcRes.data.match(/<span class="price">\s*￥?\s*([^<]+)\s*<\/span>/);
            console.log('PC Price Match:', priceMatch ? priceMatch[1] : 'Not found in HTML');
        }

    } catch (err) {
        console.error(err.message);
    }
}
testJD();