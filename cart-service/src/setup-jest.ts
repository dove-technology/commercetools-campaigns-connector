import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

process.env.CONNECT_SERVICE_URL = 'https://example.com/cart-service';
