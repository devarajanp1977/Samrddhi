// Simple test to verify candidatesApi is working
const fetch = require('node-fetch');

async function testCandidatesApi() {
    try {
        console.log('Testing Alpaca candidates endpoint...');
        
        // Test the Alpaca service
        const alpacaResponse = await fetch('http://localhost:8200/candidates?limit=10');
        console.log('Alpaca response status:', alpacaResponse.status);
        
        const alpacaData = await alpacaResponse.json();
        console.log('Alpaca data:', alpacaData);
        console.log('Alpaca data length:', alpacaData.length);
        
        if (!alpacaData || alpacaData.length === 0) {
            console.log('✅ Alpaca data is empty, frontend should fall back to mock data');
        } else {
            console.log('❌ Alpaca data is not empty, no fallback needed');
        }
        
    } catch (error) {
        console.error('Error testing candidates:', error);
    }
}

testCandidatesApi();
